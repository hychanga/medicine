-- Local (H2) seed data. user_id 'demo-user' is only useful for local testing.
INSERT INTO medicines (user_id, name, description, dosage, quantity, manufacturer, expiry_date, created_at, updated_at)
VALUES
 ('demo-user', 'Paracetamol', 'Pain reliever and fever reducer', '500mg', 120, 'Acme Pharma', '2027-03-31', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('demo-user', 'Amoxicillin', 'Antibiotic for bacterial infections', '250mg', 60, 'Globex Labs', '2026-11-30', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('demo-user', 'Ibuprofen', 'Nonsteroidal anti-inflammatory drug', '200mg', 80, 'Initech Health', '2027-08-15', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('demo-user', 'Cetirizine', 'Antihistamine for allergy relief', '10mg', 45, 'Umbrella Care', '2028-01-20', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
