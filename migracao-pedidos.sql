alter table public.orders add column if not exists phone text;
insert into public.products (name, price, active)
select 'Açaí', 20.00, true
where not exists (select 1 from public.products where name = 'Açaí');
insert into public.products (name, price, active)
select 'Bolo no pote', 15.00, true
where not exists (select 1 from public.products where name = 'Bolo no pote');
