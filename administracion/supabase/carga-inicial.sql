-- ============================================================
--  CARGA INICIAL — Administración de alquileres
--  Lamelas & Chaumont · reconstruida de la planilla de agosto
--
--  127 unidades · 122 con contrato
--
--  Pegá todo esto en el SQL Editor de Supabase y tocá Run una vez.
--  Se puede volver a ejecutar sin duplicar nada.
--
--  LO QUE HAY QUE CORREGIR DESPUÉS, unidad por unidad, desde la app:
--    · el propietario (la planilla no lo dice, salvo los cuatro conocidos)
--    · las fechas de inicio y fin de cada contrato
--    · el índice de ajuste y cada cuántos meses
--    · el teléfono de cada inquilino
--  Los contratos quedan marcados en Observaciones para que los encuentres.
-- ============================================================

begin;

create temporary table _carga (
  direccion    text,
  piso         text,
  edificio     text,
  tipo         text,
  inquilino    text,
  monto        numeric,
  honorarios   numeric,
  propietario  text,
  pct_supuesto boolean
) on commit drop;

insert into _carga values
  ('Alem 1873', '1º C', null, 'departamento', 'Daniela', 354303, 10, 'A asignar', false),
  ('Alsina 1238', null, null, 'departamento', 'Graciela del Valle Roldan', 1200000, 8, 'A asignar', false),
  ('Ampliacion Soeme', null, null, 'departamento', 'Johana', 533243, 10, 'A asignar', false),
  ('Alem 1758', 'P.3 D', null, 'departamento', 'Raquel Juarez', 476734, 10, 'A asignar', false),
  ('Galpon', null, null, 'galpon', 'Miguel Ramos', 1834927, 8, 'A asignar', false),
  ('Bernabe Araoz 140', null, null, 'departamento', 'Omaira Gonzalez', 283734, 10, 'A asignar', false),
  ('Bulnes 1020 Block 16 M2 Pb A', null, null, 'departamento', 'Rojas Maria Josefina', 676285, 10, 'A asignar', false),
  ('B.parque Sur', null, null, 'casa', 'Gisell Rios', 520386, 10, 'A asignar', false),
  ('Balcarce 424', null, null, 'departamento', 'Paula', 269641, 10, 'A asignar', false),
  ('Balcarce 720', 'Piso 9 Dpto 3', null, 'departamento', 'Palomino Agustina', 817227, 7, 'A asignar', false),
  ('Belgrano 2040', null, null, 'departamento', 'Muños Oscar Emilio', 578206, 10, 'A asignar', false),
  ('Bulnes 254', null, null, 'departamento', 'Carlos Autino', 900000, 10, 'A asignar', false),
  ('Bº Apem', null, null, 'casa', 'Fanny Quipildor', 653782, 10, 'A asignar', false),
  ('Barrio Diza', null, null, 'casa', null, 527734, 10, 'A asignar', false),
  ('Bº Vial 2', 'Mz H Casa 5', null, 'casa', 'Emy Cisneros', 560698, 10, 'A asignar', false),
  ('Bº Psicologo', 'Mz I Casa 23', null, 'casa', 'Quinteros Maria Celeste', 762745, 10, 'A asignar', false),
  ('Bº Psicologo', 'Mz D Casa 4', null, 'casa', 'Horacio Agustin Lucena', 556611, 8, 'A asignar', false),
  ('B Policial', null, null, 'casa', 'Matias Araoz', 658025, 10, 'A asignar', false),
  ('Bº Vial 2', 'Mz B Casa 11', null, 'casa', 'Fernando Rodriguez', 250000, 10, 'A asignar', false),
  ('Bº Telefonico', null, null, 'casa', 'Mauricio Navarro', 600000, 10, 'A asignar', false),
  ('Bº Sitravi', null, null, 'casa', 'David', 699605, 10, 'A asignar', false),
  ('Congreso 816', null, null, 'departamento', 'Noelia', 1062913, 10, 'A asignar', false),
  ('Corrientes 3919', null, null, 'departamento', 'Benjamin', 650000, 10, 'A asignar', true),
  ('Casa Soeme', 'Mz22 Casa 14', null, 'casa', 'Emilia', 616170, 7, 'A asignar', false),
  ('Chacho Peñaloza 551', null, null, 'departamento', 'Sergio Fonts', 1645099, 10, 'A asignar', false),
  (null, '4 F', null, 'departamento', 'Gladis Costilla', 500000, 7, 'A asignar', false),
  ('Cochera Cordoba374', null, null, 'cochera', 'Cristian Conrrado', 1981918, 8, 'A asignar', false),
  ('Chacabuco 284', '3c', null, 'departamento', 'Cristian', 391502, 10, 'A asignar', false),
  ('Chacabuco 284', null, null, 'departamento', 'Vero', 384000, 7, 'A asignar', false),
  ('Catamarca 655', null, null, 'departamento', 'Hesham', 870373, 7, 'A asignar', false),
  ('Chacabuco 452', '9 D', null, 'departamento', 'Hrabric Esteban', 392872, 10, 'A asignar', false),
  ('Consul Avellaneda 348 (5)', null, null, 'departamento', 'Arganaraz Antonella', 1315421, 7, 'A asignar', false),
  ('Duplex 1 Soeme', null, null, 'duplex', 'Agustina Millcay', 393219, 7, 'A asignar', false),
  ('Duplex 2 Soeme', null, null, 'duplex', 'Elena Brnadan', 376136, 7, 'A asignar', false),
  ('Duplex 3 Soeme', null, null, 'duplex', 'Chintia', 393219, 7, 'A asignar', false),
  ('Duplex Independecia', null, null, 'duplex', 'Maria Ester Balderrama', 516942, 10, 'A asignar', false),
  ('Ej del Norte 400', null, null, 'departamento', null, 424139, 10, 'A asignar', false),
  ('Gobernador del Campo 7', null, null, 'departamento', 'Assaf Nadia', 798049, 10, 'A asignar', false),
  ('General Paz 853', 'Blok 2 Dpto 1', null, 'departamento', 'Ivana Edhit Mata', 650000, 9, 'A asignar', false),
  ('Honduras 33', 'Dpto 8 A', null, 'departamento', 'Ana Belen Acevedo', 349481, 10, 'A asignar', false),
  ('Honduras 33', '12º Dto 3', null, 'departamento', 'Celeste Galvan', 400000, 7, 'A asignar', false),
  ('Honduras 74', null, null, 'departamento', 'Medrano Diego Alejandr', 310501, 10, 'A asignar', false),
  ('Heras 240', null, null, 'departamento', 'Mmatias Jaimovich', 600000, 7, 'A asignar', false),
  ('Local Lomas', null, null, 'local', null, 442423, 10, 'A asignar', false),
  ('Local Alem 830', null, null, 'local', 'Yamila Emili Nuñes', 383857, 10, 'A asignar', false),
  ('Local Ramon Carrillo', 'Local 1', null, 'local', null, 275000, 10, 'A asignar', false),
  ('Local V.m.m', null, null, 'local', null, 524260, 10, 'A asignar', false),
  ('Local Soeme', null, null, 'local', 'Claudia Argota', 408042, 10, 'A asignar', false),
  ('Lavalle 868', 'Piso 11 Ch', null, 'departamento', 'Agustin', 544818, 7, 'A asignar', false),
  ('Lamadrid 484', null, null, 'departamento', 'Franco', 367760, 10, 'A asignar', false),
  ('Alem 1891 6to A', '6 A', null, 'departamento', 'Marta Fernandez Houston', 370000, 10, 'A asignar', false),
  ('Local Gral.paz 980', null, null, 'local', 'Alvaro', 1187156, 6, 'A asignar', false),
  ('Loma Alta', null, null, 'departamento', 'Fatima Llanos', 667971, 10, 'A asignar', false),
  ('Las Piedras 1478', 'P 1', null, 'departamento', 'German', 600000, 10, 'A asignar', false),
  ('25 de Mayo 548', '6 A', null, 'departamento', 'Osbaldo Politi', 926190, 8, 'A asignar', false),
  ('Local Congreso 941', null, null, 'local', 'Santiago Prado', 349802, 10, 'A asignar', false),
  ('Local Mitre 174', null, null, 'local', 'Imanol', 330060, 10, 'A asignar', false),
  ('Local Heras 598', null, null, 'local', 'Carlos Daniel Salinas', 900000, 10, 'A asignar', false),
  ('Local Libano 1145', null, null, 'local', null, 1206406, 10, 'A asignar', true),
  ('Maipu 1395', '1º Dpto 5', null, 'departamento', 'Vicoria Tarcaya', 532817, 10, 'A asignar', false),
  ('Maipu 1395', 'P 1 Dpt 4', null, 'departamento', 'Fatima Pomo', 350825, 10, 'A asignar', false),
  ('Maipu 584', 'P 12 Dpto B', null, 'departamento', 'Maria Ines', 1200000, 5, 'A asignar', false),
  ('Marcos Paz 1444', '3 D', null, 'departamento', 'Abigail Arias', 400000, 7, 'A asignar', false),
  ('Marcos Paz 336', '1 B', null, 'departamento', 'Natalia', 800000, 7, 'A asignar', false),
  ('Marcospaz 80', '4 B', null, 'departamento', 'Rearte Luciana', 493499, 10, 'A asignar', false),
  ('Miguel Lillo 625', '1° D', null, 'departamento', 'German Gabriel Amar', 350000, 10, 'A asignar', true),
  ('Monteagudo 595', '5 C', null, 'departamento', 'Maria Jose', 304399, 7, 'A asignar', false),
  ('Pj Hilario Ascasubi', null, null, 'departamento', 'Tarif Akach', 692979, 7, 'A asignar', false),
  ('9 de Julio 516', null, null, 'departamento', 'Leandro', 362096, 10, 'A asignar', false),
  ('Moreno 576', 'Luz y Gas Compartido', null, 'departamento', 'Marta', 373964, 10, 'A asignar', false),
  ('Moreno 211', null, null, 'departamento', 'Vanesa', 512826, 10, 'A asignar', false),
  ('Pasaje Marconi 128', null, null, 'departamento', 'Cordoba Cesar', 735637, 10, 'A asignar', false),
  ('Pj: Savio 15', null, null, 'departamento', 'Jimena Aguirre', 850000, 10, 'A asignar', false),
  ('Pj Grossac', 'Piso 10 Dpto 4', null, 'departamento', 'Maria Ocaranza', 315200, 10, 'A asignar', false),
  ('Rioja 495', null, null, 'departamento', 'Ivana', 524260, 10, 'A asignar', false),
  ('Rep.libano 1810', 'P.b "d"', null, 'departamento', 'Carolina', 409623, 10, 'A asignar', false),
  ('San Lorenzo 325', 'Pasar Padron Cisi', null, 'departamento', 'Rodrigo Galvan', 491543, 7, 'A asignar', false),
  ('San Juan 142', null, null, 'departamento', 'Ana Paula Boix', 559334, 8, 'A asignar', false),
  ('Uruguay 974', 'Local', null, 'local', 'Quinteros Pablo', 230571, 7, 'A asignar', false),
  ('V.d la Merced 655', 'Piso 10 Dpto A', null, 'departamento', null, 1391528, 10, 'A asignar', false),
  ('San Juan 969', '8º B', null, 'departamento', 'Lorena Canivares', 500000, 8, 'A asignar', false),
  ('Av. Democracia y 9 de Julio', 'Dpto 1', 'Av. Democracia y 9 de Julio', 'departamento', 'Cordoba Sergio Raul', 326891, 10, 'A asignar', false),
  ('Av. Democracia y 9 de Julio', 'Dpto 2', 'Av. Democracia y 9 de Julio', 'departamento', null, null, null, 'A asignar', false),
  ('Av. Democracia y 9 de Julio', 'Dpto 3', 'Av. Democracia y 9 de Julio', 'departamento', 'Gabriela', 141233, 10, 'A asignar', false),
  ('Av. Democracia y 9 de Julio', 'Dpto 5', 'Av. Democracia y 9 de Julio', 'departamento', 'Toledo Lucas', 180000, 10, 'A asignar', false),
  ('Av. Democracia y 9 de Julio', 'Dpto 6', 'Av. Democracia y 9 de Julio', 'departamento', 'Karen', 233004, 10, 'A asignar', false),
  ('Av. Democracia y 9 de Julio', 'Dpto 7', 'Av. Democracia y 9 de Julio', 'departamento', 'Rocio Konsorki', 233167, 10, 'A asignar', false),
  ('Av. Democracia y 9 de Julio', 'Dpto 8', 'Av. Democracia y 9 de Julio', 'departamento', 'Luis Valenzuela', 200315, 10, 'A asignar', false),
  ('Av. Democracia y 9 de Julio', 'Local', 'Av. Democracia y 9 de Julio', 'local', 'German Romano', 334777, 10, 'A asignar', false),
  ('Matienzo 648', '1º A', 'Matienzo 648', 'departamento', 'Belen Abregu', 231093, 7, 'A asignar', false),
  ('Matienzo 648', '1º B', 'Matienzo 648', 'departamento', 'Carolina', 213937, 8, 'A asignar', false),
  ('Matienzo 648', '1º C', 'Matienzo 648', 'departamento', 'Andres Calle', 220656, 8, 'A asignar', false),
  ('Matienzo 648', '2º A', 'Matienzo 648', 'departamento', 'Julio de la Cruz', 203838, 8, 'A asignar', false),
  ('Matienzo 648', '2º B', 'Matienzo 648', 'departamento', 'Facundo Ruejas', 252249, 7, 'A asignar', false),
  ('Matienzo 648', '2º C', 'Matienzo 648', 'departamento', 'Micaela Calvente', 225354, 7, 'A asignar', false),
  ('Matienzo 648', 'Pb A', 'Matienzo 648', 'departamento', 'Isaya Julian', 236731, 7, 'A asignar', false),
  ('Matienzo 648', 'Pb B', 'Matienzo 648', 'departamento', 'Jose Luis Mamani', 246200, 8, 'A asignar', false),
  ('Matienzo 648', 'Pb C', 'Matienzo 648', 'departamento', null, null, null, 'A asignar', false),
  ('Próspero Mena 2385', 'P.b 1', 'Próspero Mena 2385', 'departamento', null, 217593, 10, 'A asignar', false),
  ('Próspero Mena 2385', '3', 'Próspero Mena 2385', 'departamento', 'Gutierres Dario', 300000, 10, 'A asignar', false),
  ('Próspero Mena 2385', '4', 'Próspero Mena 2385', 'departamento', 'Jose Ordoñez', 407074, 10, 'A asignar', false),
  ('Próspero Mena 2385', '5', 'Próspero Mena 2385', 'departamento', 'Samira', 217593, 10, 'A asignar', false),
  ('Próspero Mena 2385', '6', 'Próspero Mena 2385', 'departamento', 'Marta Mustafa', 300000, 10, 'A asignar', false),
  ('Próspero Mena 2385', '7', 'Próspero Mena 2385', 'departamento', 'Milagros Suarez', 291459, 10, 'A asignar', false),
  ('Próspero Mena 2385', '11', 'Próspero Mena 2385', 'departamento', null, null, null, 'A asignar', false),
  ('Próspero Mena 2385', '12', 'Próspero Mena 2385', 'departamento', 'Hugo Palacios', 217593, 10, 'A asignar', false),
  ('Próspero Mena 2385', '14', 'Próspero Mena 2385', 'departamento', 'Maria Bascary', 346755, 10, 'A asignar', false),
  ('Próspero Mena 2385', '16', 'Próspero Mena 2385', 'departamento', null, null, null, 'A asignar', false),
  ('Monteagudo 328', '1 A', null, 'departamento', 'Carolina Pascual', 396763, 7, 'Norma Maldonado', false),
  ('Monteagudo 328', '6 F', null, 'departamento', 'Bianca Pereira', 398691, 7, 'Norma Maldonado', false),
  ('Catamarca 639', '9 B', null, 'departamento', null, 900000, 7, 'Norma Maldonado', false),
  ('Monteagudo 328', '2 F', null, 'departamento', 'Miranda Ione', 370666, 7, 'Silva Maldonado', false),
  ('Monteagudo 328', '3 F', null, 'departamento', null, 398691, 7, 'Silva Maldonado', false),
  ('Catamarca 639', '2 C', null, 'departamento', 'Sara Villagra', 751450, 7, 'Silva Maldonado', false),
  ('Cochera Catamarca', null, null, 'cochera', null, 70752, 7, 'Silva Maldonado', false),
  ('Monteagudo 328', '2 B', null, 'departamento', null, null, null, 'Cristina Maldonado', false),
  ('Monteagudo 328', '4 F', null, 'departamento', 'Godoy Jose Manuel', 393838, 7, 'Cristina Maldonado', false),
  ('Catamarca 639', '4 A', null, 'departamento', 'Franco Maria Belen', 533826, 7, 'Cristina Maldonado', false),
  ('Catamarca 639', '6 D', null, 'departamento', null, 500401, 7, 'Cristina Maldonado', false),
  ('Cochera Balcarce', null, null, 'cochera', 'Cecilia Saenz', 96000, 7, 'Dr. José Attar', false),
  ('Dpto 1', null, null, 'departamento', 'Vallejo', 531681, 7, 'Dr. José Attar', false),
  ('Dpto 2 Ph Rivadavia', null, null, 'departamento', 'Lorena Plaza', 622719, 7, 'Dr. José Attar', false),
  ('Dpto 3', null, null, 'departamento', 'Luis Miguel Piñer', 622719, 7, 'Dr. José Attar', false),
  ('Dpto 4 Ph Riv.', null, null, 'departamento', 'Adriana Gomez', 616937, 7, 'Dr. José Attar', false),
  ('Local 2 Grande', null, null, 'local', 'Adriana Gomez', 370163, 7, 'Dr. José Attar', false),
  ('Local 1 Chico', null, null, 'local', 'Barberia', 286196, 7, 'Dr. José Attar', false),
  ('Sarmiento 156', null, null, 'departamento', 'Nora Segura', 543983, 7, 'Dr. José Attar', false);

-- 1 ── Propietarios ────────────────────────────────────────────
insert into public.propietarios (nombre, notas)
select distinct c.propietario,
       case when c.propietario = 'A asignar'
            then 'Marcador de la carga inicial. Reasigná cada unidad a su dueño real y después borrá este.'
       end
from _carga c
where not exists (
  select 1 from public.propietarios p
  where p.nombre = c.propietario and p.deleted_at is null
);

-- 2 ── Inquilinos ──────────────────────────────────────────────
insert into public.inquilinos (nombre, notas)
select distinct c.inquilino, 'Cargado de la planilla. Falta el teléfono.'
from _carga c
where c.inquilino is not null
  and not exists (
    select 1 from public.inquilinos i
    where i.nombre = c.inquilino and i.deleted_at is null
  );

-- 3 ── Propiedades ─────────────────────────────────────────────
insert into public.propiedades
  (propietario_id, direccion, piso_depto, edificio, tipo,
   localidad, provincia, estado)
select p.id, c.direccion, c.piso, c.edificio, c.tipo,
       'San Miguel de Tucumán', 'Tucumán',
       case when c.inquilino is null then 'disponible' else 'alquilado' end
from _carga c
join public.propietarios p
  on p.nombre = c.propietario and p.deleted_at is null
where not exists (
  select 1 from public.propiedades x
  where x.direccion = c.direccion
    and coalesce(x.piso_depto, '') = coalesce(c.piso, '')
    and x.deleted_at is null
);

-- 4 ── Contratos ───────────────────────────────────────────────
-- Las fechas son provisorias: arrancan el 1º de este mes y duran tres años.
-- El índice queda en ICL cada 3 meses, que es lo más habitual hoy.
insert into public.contratos
  (propiedad_id, inquilino_id, fecha_inicio, fecha_fin, destino, moneda,
   monto_inicial, monto_actual, dia_vencimiento, honorarios_porcentaje,
   indice, ajuste_frecuencia_meses, observaciones)
select
  pr.id, iq.id,
  date_trunc('month', current_date)::date,
  (date_trunc('month', current_date) + interval '3 years' - interval '1 day')::date,
  case when c.tipo in ('local', 'galpon', 'cochera') then 'comercial' else 'vivienda' end,
  'ARS', c.monto, c.monto, 10, c.honorarios, 'ICL', 3,
  'CARGA INICIAL — revisar fechas, índice y frecuencia.'
  || case when c.pct_supuesto
          then ' El % de honorarios se estimó en 10: la planilla no lo traía.'
          else '' end
from _carga c
join public.propiedades pr
  on pr.direccion = c.direccion
 and coalesce(pr.piso_depto, '') = coalesce(c.piso, '')
 and pr.deleted_at is null
join public.inquilinos iq
  on iq.nombre = c.inquilino and iq.deleted_at is null
where c.monto is not null
  and c.inquilino is not null
  and not exists (
    select 1 from public.contratos t
    where t.propiedad_id = pr.id and t.deleted_at is null
  );

commit;

-- ============================================================
--  Comprobación
-- ============================================================
select 'propietarios' as tabla, count(*) from public.propietarios where deleted_at is null
union all select 'propiedades', count(*) from public.propiedades where deleted_at is null
union all select 'inquilinos',  count(*) from public.inquilinos  where deleted_at is null
union all select 'contratos',   count(*) from public.contratos   where deleted_at is null
union all select 'suma alquileres', sum(monto_actual)::bigint from public.contratos where deleted_at is null;
