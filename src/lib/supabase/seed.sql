insert into public.customers (customer_id, full_name, email, phone, address, loyalty_tier, status)
values
  ('GWL-000001', 'Nikos Papadopoulos', 'nikos@glowworks.lab', '+30 693 715 3914', 'Rhodes, Greece', 'diamond', 'active')
on conflict (customer_id) do nothing;

insert into public.services (service_id, name, category, description, price, duration_days)
values
  ('svc-ambient', 'Ambient Lighting', 'lighting', 'OEM-style ambient interior illumination', 1200, 2),
  ('svc-starlight', 'Starlight Headliner', 'headliner', 'Custom starlight headliner installation', 2800, 3),
  ('svc-steering', 'Custom Steering Wheel', 'interior', 'Premium leather steering wheel upgrade', 900, 1)
on conflict (service_id) do nothing;

insert into public.gallery (gallery_id, title, description, image_url, category, is_featured)
values
  ('gallery-001', 'Mercedes A-Class Upgrade', 'Ambient lighting and premium finishing', '/images/mercedes_a_class_w1172.jpg', 'project', true),
  ('gallery-002', 'BMW Interior Detail', 'Starlight-inspired premium work', '/images/IMG_2085.JPEG', 'project', true)
on conflict (gallery_id) do nothing;

insert into public.discounts (discount_id, code, description, percentage, valid_from, valid_to, is_active)
values
  ('discount-001', 'GLOW10', 'Spring launch offer', 10, current_date, current_date + interval '30 days', true)
on conflict (discount_id) do nothing;

insert into public.admins (admin_id, full_name, email, role, is_active)
values
  ('admin-001', 'Glowworks Admin', 'admin@glowworks.lab', 'manager', true)
on conflict (admin_id) do nothing;
