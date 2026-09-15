-- ============================================================
-- HappyFaces - Instituto de Inglés
-- Schema completo Supabase / PostgreSQL
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- Extiende auth.users con rol y datos adicionales
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WALLETS
-- Un wallet por alumno
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance     INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

-- ============================================================
-- TRANSACTIONS
-- Historial completo de movimientos de HappyFaces
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id   UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  origin      TEXT NOT NULL DEFAULT 'manual',
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROOMS
-- Salas de juego creadas por profesores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  password     TEXT,
  teacher_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_type    TEXT NOT NULL DEFAULT 'quiz',
  config       JSONB NOT NULL DEFAULT '{}',
  coin_reward  INTEGER NOT NULL DEFAULT 5 CHECK (coin_reward >= 0),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ
);

-- ============================================================
-- ROOM_PARTICIPANTS
-- Alumnos que se unen a una sala
-- ============================================================
CREATE TABLE IF NOT EXISTS public.room_participants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id         UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  score           INTEGER NOT NULL DEFAULT 0,
  reward_granted  BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(room_id, student_id)
);

-- ============================================================
-- STORE_ITEMS
-- Catálogo de la tienda de premios
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  coin_price    INTEGER NOT NULL CHECK (coin_price > 0),
  stock         INTEGER NOT NULL DEFAULT -1,  -- -1 = ilimitado
  image_url     TEXT,
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STORE_PURCHASES
-- Canjes realizados por alumnos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_purchases (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id       UUID NOT NULL REFERENCES public.store_items(id) ON DELETE RESTRICT,
  quantity      INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_cost    INTEGER NOT NULL CHECK (total_cost > 0),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'cancelled')),
  purchased_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ============================================================
-- TRIGGER: crear wallet automáticamente al insertar un alumno
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_wallet_for_student()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO public.wallets (student_id, balance)
    VALUES (NEW.id, 0)
    ON CONFLICT (student_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_insert_create_wallet ON public.profiles;

CREATE TRIGGER on_profile_insert_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_wallet_for_student();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_purchases ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
-- Cada usuario puede ver su propio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admin puede ver todos los perfiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Teacher puede ver perfiles de sus alumnos
CREATE POLICY "profiles_select_teacher"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );

-- ---- WALLETS ----
-- Cada alumno solo ve su propio wallet
CREATE POLICY "wallets_select_own"
  ON public.wallets FOR SELECT
  USING (auth.uid() = student_id);

-- Admin y teacher pueden ver todos los wallets
CREATE POLICY "wallets_select_staff"
  ON public.wallets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher')
    )
  );

-- Solo el service role (backend) puede modificar wallets
CREATE POLICY "wallets_update_service"
  ON public.wallets FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

-- ---- TRANSACTIONS ----
-- Cada alumno ve sus propias transacciones
CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = wallet_id AND w.student_id = auth.uid()
    )
  );

-- Admin y teacher pueden ver todas las transacciones
CREATE POLICY "transactions_select_staff"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher')
    )
  );

-- ---- ROOMS ----
-- Todos los usuarios autenticados pueden ver salas activas
CREATE POLICY "rooms_select_authenticated"
  ON public.rooms FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Solo teachers y admins pueden crear/editar salas
CREATE POLICY "rooms_insert_staff"
  ON public.rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "rooms_update_staff"
  ON public.rooms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher')
    )
  );

-- ---- ROOM_PARTICIPANTS ----
CREATE POLICY "room_participants_select"
  ON public.room_participants FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "room_participants_insert_own"
  ON public.room_participants FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- ---- STORE_ITEMS ----
-- Todos pueden ver ítems disponibles
CREATE POLICY "store_items_select"
  ON public.store_items FOR SELECT
  USING (is_available = TRUE OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- ---- STORE_PURCHASES ----
-- Cada alumno ve sus propias compras
CREATE POLICY "store_purchases_select_own"
  ON public.store_purchases FOR SELECT
  USING (auth.uid() = student_id);

-- Admin puede ver todas las compras
CREATE POLICY "store_purchases_select_admin"
  ON public.store_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
