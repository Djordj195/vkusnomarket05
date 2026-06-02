-- Версионирование юридических документов.
-- Каждая запись = одна опубликованная редакция документа.
create table if not exists legal_versions (
  id            text primary key,
  doc_slug      text not null,
  revision      text not null,         -- e.g. "v2", "v3"
  published_at  timestamptz not null default now(),
  published_by  text not null default 'admin',
  change_summary text not null default '',
  is_current    boolean not null default true
);

create index if not exists idx_legal_versions_slug
  on legal_versions (doc_slug, published_at desc);
