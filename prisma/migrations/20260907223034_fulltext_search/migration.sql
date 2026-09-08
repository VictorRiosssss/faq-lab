-- Full-text search (tsvector) + trigram similarity (pg_trgm) for fuzzy matching.
-- Prisma does not model tsvector natively, so this column/index setup is hand-written
-- (the model declares it as `Unsupported("tsvector")`, which Prisma ignores on diff).

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- unaccent() is only STABLE (not IMMUTABLE), and array_to_string() is only
-- accepted as STABLE for its polymorphic (anyarray) signature — Postgres
-- refuses both directly inside a GENERATED ALWAYS ... STORED expression.
-- Thin IMMUTABLE wrappers are the standard, documented workaround (safe here:
-- our unaccent rules and array-to-string behavior don't change at runtime).
CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text AS $$
  SELECT unaccent('unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

CREATE OR REPLACE FUNCTION immutable_array_to_string(text[], text) RETURNS text AS $$
  SELECT array_to_string($1, $2)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- The base migration already created a plain (non-generated) "searchVector"
-- column, because Prisma materializes `Unsupported("tsvector")` fields as a
-- bare column. Drop it and re-add it as a generated column below.
ALTER TABLE "Question" DROP COLUMN "searchVector";

ALTER TABLE "Question" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', immutable_unaccent(coalesce(question, ''))), 'A') ||
    setweight(to_tsvector('portuguese', immutable_unaccent(immutable_array_to_string(keywords, ' '))), 'A') ||
    setweight(to_tsvector('portuguese', immutable_unaccent(coalesce("answerText", ''))), 'B')
  ) STORED;

CREATE INDEX question_search_vector_idx ON "Question" USING GIN ("searchVector");
CREATE INDEX question_question_trgm_idx ON "Question" USING GIN (question gin_trgm_ops);
CREATE INDEX question_answer_text_trgm_idx ON "Question" USING GIN ("answerText" gin_trgm_ops);
