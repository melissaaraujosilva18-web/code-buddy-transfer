import { supabase } from "@/integrations/supabase/client";

export const importUsersFromCSV = async () => {
  const users = [
    { id: '17f63532-a09b-4a8d-acb9-12d33eac05bc', email: 'tativitoria2017@gmail.com', full_name: 'Tatiane Vitória', balance: 0.00, has_deposited: false, bonus_claimed: false, pix_key: null, withdrawal_status: null, withdrawal_amount: 0, pix_key_type: null, pix_name: null },
    { id: '4ec742de-d735-4895-b530-09586b7d5077', email: 'marcosviniciuslkk@gmail.com', full_name: 'Marcos Vinicius Dos Santos', balance: 9.16, has_deposited: true, bonus_claimed: true, pix_key: '06852767590', withdrawal_status: 'awaiting_fee', withdrawal_amount: 780, pix_key_type: 'cpf', pix_name: 'Marcos Vinicius dos Santos' },
    { id: 'e11ad2b5-cd20-4080-a9ba-d35982301d4d', email: 'oeduardobets@gmail.com', full_name: 'Tatiane Vitória', balance: 0.00, has_deposited: false, bonus_claimed: false, pix_key: null, withdrawal_status: null, withdrawal_amount: 0, pix_key_type: null, pix_name: null },
    { id: '21033165-5a94-4ed1-bf48-6e3706132dab', email: 'iasdfatima2@gmail.com', full_name: 'Danilo pinheiro dos Santos', balance: 9.16, has_deposited: true, bonus_claimed: true, pix_key: '06852784509', withdrawal_status: 'awaiting_fee', withdrawal_amount: 780, pix_key_type: 'cpf', pix_name: 'Danilo Pinheiro dos Santos' },
    { id: '937c1568-17b6-45d6-b266-1ecfe219fbac', email: 'teste@equiperocket.com.br', full_name: 'teste', balance: 0.00, has_deposited: false, bonus_claimed: false, pix_key: null, withdrawal_status: null, withdrawal_amount: 0, pix_key_type: null, pix_name: null },
    { id: '13d579d1-11d8-4220-9624-da7310795efd', email: 'teste@teste.com', full_name: 'teste', balance: 0.00, has_deposited: false, bonus_claimed: false, pix_key: null, withdrawal_status: null, withdrawal_amount: 0, pix_key_type: null, pix_name: null },
    { id: '7c7f285e-0d3f-4da5-8856-e0716cc7d0e7', email: 'patricinho9714@gmail.com', full_name: 'Alex', balance: 0.16, has_deposited: true, bonus_claimed: true, pix_key: '07118633500', withdrawal_status: 'awaiting_fee', withdrawal_amount: 789, pix_key_type: 'cpf', pix_name: 'Alex Patrício Barreto santos' },
    { id: 'ff7d6aee-0bc7-4669-9cc1-c6401236f3d2', email: 'vulgonegao108@gmail.com', full_name: '86995572605', balance: 0.00, has_deposited: false, bonus_claimed: false, pix_key: null, withdrawal_status: null, withdrawal_amount: 0, pix_key_type: null, pix_name: null },
    { id: '695de9cc-bc2b-4802-9950-d3d01e0da984', email: 'bernardoturetta06@gmail.com', full_name: 'Bernardo', balance: 0.00, has_deposited: false, bonus_claimed: false, pix_key: null, withdrawal_status: null, withdrawal_amount: 0, pix_key_type: null, pix_name: null },
    { id: 'b2c7aaed-104c-41f5-af0b-1a96f4755ffe', email: 'gustavohenrique83680@gmail.com', full_name: 'Gustavo', balance: 9.16, has_deposited: true, bonus_claimed: true, pix_key: '11192095952', withdrawal_status: 'awaiting_fee', withdrawal_amount: 780, pix_key_type: 'cpf', pix_name: 'Gustavo Henrique dos Santos Silva' },
    { id: '1b29dffd-a382-4789-9ddb-b6f3cf5bdd17', email: 'watsonkaian121@gmail.com', full_name: 'Savio talisson rodrigues dos santos', balance: 0.00, has_deposited: false, bonus_claimed: false, pix_key: null, withdrawal_status: null, withdrawal_amount: 0, pix_key_type: null, pix_name: null },
    { id: '34b78e65-16e0-4a02-95b9-85338193c48d', email: 'ayrtonsliva233222@gmail.com', full_name: 'Airton', balance: 0.00, has_deposited: false, bonus_claimed: false, pix_key: null, withdrawal_status: null, withdrawal_amount: 0, pix_key_type: null, pix_name: null },
    { id: 'f2220477-cfff-493d-a8fe-3646931a70a5', email: 'kalindlandim20@gmail.com', full_name: 'Willian', balance: 0.16, has_deposited: true, bonus_claimed: true, pix_key: '61991711127', withdrawal_status: 'awaiting_fee', withdrawal_amount: 789, pix_key_type: 'phone', pix_name: 'Willian Wallace Araújo Landim' },
    { id: 'f19502a6-d770-4f48-90d3-5d72fc9efba0', email: 'fmarcelinss@hotmail.com', full_name: 'Francisco Marcelino', balance: 79.06, has_deposited: true, bonus_claimed: true, pix_key: '89809297300', withdrawal_status: 'awaiting_fee', withdrawal_amount: 789, pix_key_type: 'cpf', pix_name: 'Francisco Marcelino da Silva Sousa' },
    { id: '17b06c0d-40d9-4ac8-b6ec-c020aebeef02', email: 'fernandoalison777@gmail.com', full_name: 'Alison Fernando da Silva Ramos', balance: 0.00, has_deposited: false, bonus_claimed: false, pix_key: null, withdrawal_status: null, withdrawal_amount: 0, pix_key_type: null, pix_name: null },
    { id: '2a3881a6-06eb-470c-98a3-8d4fbaa07a89', email: 'rubiedsonsilva12@gmail.com', full_name: 'RubiedsonSantos', balance: 0.00, has_deposited: false, bonus_claimed: false, pix_key: null, withdrawal_status: null, withdrawal_amount: 0, pix_key_type: null, pix_name: null }
  ];

  const roles = [
    { user_id: '4ec742de-d735-4895-b530-09586b7d5077', role: 'admin' }
  ];

  try {
    const { data, error } = await supabase.functions.invoke('import-users', {
      body: { users, roles }
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
};
