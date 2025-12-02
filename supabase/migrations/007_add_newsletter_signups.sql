-- Create newsletter_signups table to store email signups
CREATE TABLE IF NOT EXISTS public.newsletter_signups (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  subscribed_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT newsletter_signups_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_signups_email
ON public.newsletter_signups USING btree (email) TABLESPACE pg_default;

-- Add comment
COMMENT ON TABLE public.newsletter_signups IS 'Stores email addresses for newsletter subscriptions';
