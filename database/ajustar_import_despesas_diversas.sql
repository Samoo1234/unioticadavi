-- Modificar o script de importação para usar a estrutura correta da tabela
INSERT INTO "public"."despesas_diversas" 
("id", "filial_id", "categoria_id", "nome", "valor", "data", "descricao", "data_pagamento", "forma_pagamento", "status", "observacao", "comprovante_url", "created_at", "updated_at") 
VALUES 
('3', '1', '12', 'lanche', '30.00', '2025-06-21', 'lanche', null, null, 'pendente', null, null, '2025-06-21 17:56:11.240187+00', '2025-06-21 17:56:11.240187+00'), 
('5', '1', '22', 'Despesa Diversa', '29.00', '2025-07-28', 'Despesa Diversa', null, null, 'pendente', null, null, '2025-07-28 13:11:12.296066+00', '2025-07-28 13:11:12.296066+00'), 
('6', '1', '22', 'Despesa Diversa', '9.99', '2025-07-28', 'Despesa Diversa', null, null, 'pendente', null, null, '2025-07-28 13:11:39.389571+00', '2025-07-28 13:11:39.389571+00'), 
('7', '1', '22', 'Despesa Diversa', '235.57', '2025-07-28', 'Despesa Diversa', null, null, 'pendente', null, null, '2025-07-28 13:12:38.092205+00', '2025-07-28 13:12:38.092205+00'), 
('8', '1', '8', 'Despesa Diversa', '50.00', '2025-07-28', 'Despesa Diversa', null, null, 'pendente', null, null, '2025-07-28 13:13:02.88465+00', '2025-07-28 13:13:02.88465+00'), 
('9', '1', '12', 'Despesa Diversa', '62.00', '2025-07-28', 'Despesa Diversa', null, null, 'pendente', null, null, '2025-07-28 13:13:23.288243+00', '2025-07-28 13:13:23.288243+00'), 
('10', '1', '12', 'Despesa Diversa', '40.00', '2025-07-28', 'Despesa Diversa', null, null, 'pendente', null, null, '2025-07-28 13:13:40.7686+00', '2025-07-28 13:13:40.7686+00'), 
('11', '6', '22', 'Despesa Diversa', '10.99', '2025-07-28', 'Despesa Diversa', null, null, 'pendente', null, null, '2025-07-28 13:14:08.85464+00', '2025-07-28 13:14:08.85464+00'), 
('12', '4', '12', 'Despesa Diversa', '65.00', '2025-07-28', 'Despesa Diversa', null, null, 'pendente', null, null, '2025-07-28 13:15:31.151565+00', '2025-07-28 13:15:31.151565+00'), 
('13', '4', '12', 'Despesa Diversa', '67.69', '2025-07-28', 'Despesa Diversa', null, null, 'pendente', null, null, '2025-07-28 13:16:20.362291+00', '2025-07-28 13:16:20.362291+00'), 
('14', '4', '22', 'Despesa Diversa', '32.00', '2025-07-28', 'Despesa Diversa', null, null, 'pendente', null, null, '2025-07-28 13:17:03.813665+00', '2025-07-28 13:17:03.813665+00');
