-- Create public storage bucket for servicios media (hero images, gallery, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('servicios-media', 'servicios-media', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
