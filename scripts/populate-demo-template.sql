-- ============================================================
-- Populate demo-template wedding with rich mock data
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================
-- This script is IDEMPOTENT — safe to run multiple times.
-- ============================================================

-- Step 0: Verify template exists
DO $$
DECLARE
  _wid UUID;
BEGIN
  SELECT id INTO _wid FROM weddings WHERE slug = 'demo-template';
  IF _wid IS NULL THEN
    RAISE EXCEPTION 'Wedding with slug "demo-template" not found. Create the template wedding first.';
  END IF;
  RAISE NOTICE 'Template wedding ID: %', _wid;
END $$;


-- ============================================================
-- 1. GUESTS (150 guests)
-- ============================================================
INSERT INTO guests (wedding_id, name, email, phone, avatar_color, avatar_seed, avatar_style, wedding_side)
SELECT 'demo-template', g.name, g.email, g.phone, g.avatar_color, g.avatar_seed, g.avatar_style, g.wedding_side
FROM weddings w,
(VALUES
  ('Priya Sharma',       'priya.sharma@demo.phera.io',       '+919800000001', '#E91E63', 'priya',       'lorelei', 'bride'),
  ('Arjun Patel',        'arjun.patel@demo.phera.io',        '+919800000002', '#2196F3', 'arjun',       'bottts',  'groom'),
  ('Ananya Mehta',       'ananya.mehta@demo.phera.io',       '+919800000003', '#9C27B0', 'ananya',      'lorelei', 'bride'),
  ('Rohan Kapoor',       'rohan.kapoor@demo.phera.io',       '+919800000004', '#FF9800', 'rohan',       'bottts',  'groom'),
  ('Diya Nair',          'diya.nair@demo.phera.io',          '+919800000005', '#4CAF50', 'diya',        'lorelei', 'bride'),
  ('Vikram Singh',       'vikram.singh@demo.phera.io',       '+919800000006', '#795548', 'vikram',      'bottts',  'groom'),
  ('Kavya Iyer',         'kavya.iyer@demo.phera.io',         '+919800000007', '#FF5722', 'kavya',       'lorelei', 'bride'),
  ('Aditya Reddy',       'aditya.reddy@demo.phera.io',       '+919800000008', '#3F51B5', 'aditya',      'bottts',  'groom'),
  ('Meera Joshi',        'meera.joshi@demo.phera.io',        '+919800000009', '#E91E63', 'meera',       'lorelei', 'bride'),
  ('Karan Malhotra',     'karan.malhotra@demo.phera.io',     '+919800000010', '#009688', 'karan',       'bottts',  'groom'),
  ('Isha Gupta',         'isha.gupta@demo.phera.io',         '+919800000011', '#673AB7', 'isha',        'lorelei', 'bride'),
  ('Raj Verma',          'raj.verma@demo.phera.io',          '+919800000012', '#F44336', 'raj',         'bottts',  'groom'),
  ('Neha Bhatia',        'neha.bhatia@demo.phera.io',        '+919800000013', '#00BCD4', 'neha',        'lorelei', 'bride'),
  ('Siddharth Das',      'siddharth.das@demo.phera.io',      '+919800000014', '#8BC34A', 'siddharth',   'bottts',  'groom'),
  ('Tara Choudhury',     'tara.choudhury@demo.phera.io',     '+919800000015', '#CDDC39', 'tara',        'lorelei', 'both'),
  ('Amit Saxena',        'amit.saxena@demo.phera.io',        '+919800000016', '#607D8B', 'amit',        'bottts',  'groom'),
  ('Riya Deshmukh',      'riya.deshmukh@demo.phera.io',      '+919800000017', '#E040FB', 'riya',        'lorelei', 'bride'),
  ('Vivek Agarwal',      'vivek.agarwal@demo.phera.io',      '+919800000018', '#FF6F00', 'vivek',       'bottts',  'groom'),
  ('Sunita Sharma',      'sunita.sharma@demo.phera.io',      '+919800000019', '#E91E63', 'sunita',      'lorelei', 'bride'),
  ('Vijay Patel',        'vijay.patel@demo.phera.io',        '+919800000020', '#2196F3', 'vijay',       'bottts',  'groom'),
  ('Nandini Rao',        'nandini.rao@demo.phera.io',        '+919800000021', '#AB47BC', 'nandini',     'lorelei', 'bride'),
  ('Harsh Trivedi',      'harsh.trivedi@demo.phera.io',      '+919800000022', '#FF7043', 'harsh',       'bottts',  'groom'),
  ('Pooja Kulkarni',     'pooja.kulkarni@demo.phera.io',     '+919800000023', '#26A69A', 'pooja',       'lorelei', 'bride'),
  ('Manish Tiwari',      'manish.tiwari@demo.phera.io',      '+919800000024', '#5C6BC0', 'manish',      'bottts',  'groom'),
  ('Swati Pillai',       'swati.pillai@demo.phera.io',       '+919800000025', '#EC407A', 'swati',       'lorelei', 'bride'),
  ('Deepak Jain',        'deepak.jain@demo.phera.io',        '+919800000026', '#66BB6A', 'deepak',      'bottts',  'groom'),
  ('Ankita Mishra',      'ankita.mishra@demo.phera.io',      '+919800000027', '#FFA726', 'ankita',      'lorelei', 'bride'),
  ('Rajesh Khanna',      'rajesh.khanna@demo.phera.io',      '+919800000028', '#42A5F5', 'rajesh',      'bottts',  'groom'),
  ('Divya Menon',        'divya.menon@demo.phera.io',        '+919800000029', '#CE93D8', 'divya',       'lorelei', 'bride'),
  ('Suresh Pandey',      'suresh.pandey@demo.phera.io',      '+919800000030', '#A1887F', 'suresh',      'bottts',  'groom'),
  ('Shreya Chatterjee',  'shreya.chatterjee@demo.phera.io',  '+919800000031', '#EF5350', 'shreya',      'lorelei', 'bride'),
  ('Nikhil Sinha',       'nikhil.sinha@demo.phera.io',       '+919800000032', '#29B6F6', 'nikhil',      'bottts',  'groom'),
  ('Pallavi Deshpande',  'pallavi.deshpande@demo.phera.io',  '+919800000033', '#7E57C2', 'pallavi',     'lorelei', 'bride'),
  ('Gaurav Bhatt',       'gaurav.bhatt@demo.phera.io',       '+919800000034', '#FFA000', 'gaurav',      'bottts',  'groom'),
  ('Ritika Soni',        'ritika.soni@demo.phera.io',        '+919800000035', '#EC407A', 'ritika',      'lorelei', 'bride'),
  ('Varun Chauhan',      'varun.chauhan@demo.phera.io',      '+919800000036', '#26C6DA', 'varun',       'bottts',  'groom'),
  ('Nisha Rajan',        'nisha.rajan@demo.phera.io',        '+919800000037', '#AB47BC', 'nisha',       'lorelei', 'bride'),
  ('Ashish Dubey',       'ashish.dubey@demo.phera.io',       '+919800000038', '#8D6E63', 'ashish',      'bottts',  'groom'),
  ('Tanvi Hegde',        'tanvi.hegde@demo.phera.io',        '+919800000039', '#FF8A65', 'tanvi',       'lorelei', 'bride'),
  ('Kunal Sethi',        'kunal.sethi@demo.phera.io',        '+919800000040', '#5C6BC0', 'kunal',       'bottts',  'groom'),
  ('Aditi Banerjee',     'aditi.banerjee@demo.phera.io',     '+919800000041', '#F06292', 'aditi',       'lorelei', 'bride'),
  ('Pranav Thakur',      'pranav.thakur@demo.phera.io',      '+919800000042', '#81C784', 'pranav',      'bottts',  'groom'),
  ('Megha Awasthi',      'megha.awasthi@demo.phera.io',      '+919800000043', '#BA68C8', 'megha',       'lorelei', 'bride'),
  ('Rahul Dixit',        'rahul.dixit@demo.phera.io',        '+919800000044', '#4FC3F7', 'rahul',       'bottts',  'groom'),
  ('Shalini Bose',       'shalini.bose@demo.phera.io',       '+919800000045', '#F48FB1', 'shalini',     'lorelei', 'bride'),
  ('Ajay Chauhan',       'ajay.chauhan@demo.phera.io',       '+919800000046', '#AED581', 'ajay',        'bottts',  'groom'),
  ('Bhavna Khurana',     'bhavna.khurana@demo.phera.io',     '+919800000047', '#CE93D8', 'bhavna',      'lorelei', 'bride'),
  ('Mohit Aggarwal',     'mohit.aggarwal@demo.phera.io',     '+919800000048', '#4DD0E1', 'mohit',       'bottts',  'groom'),
  ('Sakshi Luthra',      'sakshi.luthra@demo.phera.io',      '+919800000049', '#F06292', 'sakshi',      'lorelei', 'bride'),
  ('Dev Anand',          'dev.anand@demo.phera.io',          '+919800000050', '#FFB74D', 'dev',         'bottts',  'groom'),
  ('Jaya Krishnan',      'jaya.krishnan@demo.phera.io',      '+919800000051', '#E91E63', 'jaya',        'lorelei', 'bride'),
  ('Pankaj Mehra',       'pankaj.mehra@demo.phera.io',       '+919800000052', '#7986CB', 'pankaj',      'bottts',  'groom'),
  ('Lalita Vyas',        'lalita.vyas@demo.phera.io',        '+919800000053', '#F8BBD0', 'lalita',      'lorelei', 'bride'),
  ('Sanjay Gill',        'sanjay.gill@demo.phera.io',        '+919800000054', '#80CBC4', 'sanjay',      'bottts',  'groom'),
  ('Geeta Narayan',      'geeta.narayan@demo.phera.io',      '+919800000055', '#CE93D8', 'geeta',       'lorelei', 'bride'),
  ('Ramesh Ahuja',       'ramesh.ahuja@demo.phera.io',       '+919800000056', '#90A4AE', 'ramesh',      'bottts',  'groom'),
  ('Usha Bhargava',      'usha.bhargava@demo.phera.io',      '+919800000057', '#EF9A9A', 'usha',        'lorelei', 'bride'),
  ('Navin Oberoi',       'navin.oberoi@demo.phera.io',       '+919800000058', '#80DEEA', 'navin',       'bottts',  'groom'),
  ('Rekha Tandon',       'rekha.tandon@demo.phera.io',       '+919800000059', '#F48FB1', 'rekha',       'lorelei', 'bride'),
  ('Anil Chadha',        'anil.chadha@demo.phera.io',        '+919800000060', '#A5D6A7', 'anil',        'bottts',  'groom'),
  ('Kamini Srivastava',  'kamini.srivastava@demo.phera.io',  '+919800000061', '#CE93D8', 'kamini',      'lorelei', 'bride'),
  ('Hemant Grover',      'hemant.grover@demo.phera.io',      '+919800000062', '#90CAF9', 'hemant',      'bottts',  'groom'),
  ('Vandana Kapur',      'vandana.kapur@demo.phera.io',      '+919800000063', '#F48FB1', 'vandana',     'lorelei', 'bride'),
  ('Tarun Bajaj',        'tarun.bajaj@demo.phera.io',        '+919800000064', '#FFE082', 'tarun',       'bottts',  'groom'),
  ('Shikha Dhawan',      'shikha.dhawan@demo.phera.io',      '+919800000065', '#E1BEE7', 'shikha',      'lorelei', 'bride'),
  ('Piyush Goel',        'piyush.goel@demo.phera.io',        '+919800000066', '#B2DFDB', 'piyush',      'bottts',  'groom'),
  ('Mala Saini',         'mala.saini@demo.phera.io',         '+919800000067', '#F8BBD0', 'mala',        'lorelei', 'bride'),
  ('Girish Vohra',       'girish.vohra@demo.phera.io',       '+919800000068', '#BBDEFB', 'girish',      'bottts',  'groom'),
  ('Chitra Mahajan',     'chitra.mahajan@demo.phera.io',     '+919800000069', '#E1BEE7', 'chitra',      'lorelei', 'bride'),
  ('Yash Taneja',        'yash.taneja@demo.phera.io',        '+919800000070', '#C8E6C9', 'yash',        'bottts',  'groom'),
  ('Sonia Arora',        'sonia.arora@demo.phera.io',        '+919800000071', '#F48FB1', 'sonia',       'lorelei', 'bride'),
  ('Lalit Walia',        'lalit.walia@demo.phera.io',        '+919800000072', '#81D4FA', 'lalit',       'bottts',  'groom'),
  ('Padma Venkatesh',    'padma.venkatesh@demo.phera.io',    '+919800000073', '#CE93D8', 'padma',       'lorelei', 'bride'),
  ('Dinesh Khatri',      'dinesh.khatri@demo.phera.io',      '+919800000074', '#FFCC80', 'dinesh',      'bottts',  'groom'),
  ('Aparna Sundaram',    'aparna.sundaram@demo.phera.io',    '+919800000075', '#F06292', 'aparna',      'lorelei', 'bride'),
  ('Mukesh Mittal',      'mukesh.mittal@demo.phera.io',      '+919800000076', '#80CBC4', 'mukesh',      'bottts',  'groom'),
  ('Renu Thapar',        'renu.thapar@demo.phera.io',        '+919800000077', '#EF9A9A', 'renu',        'lorelei', 'bride'),
  ('Saurabh Khosla',     'saurabh.khosla@demo.phera.io',     '+919800000078', '#90A4AE', 'saurabh',     'bottts',  'groom'),
  ('Aarti Purohit',      'aarti.purohit@demo.phera.io',      '+919800000079', '#F48FB1', 'aarti',       'lorelei', 'bride'),
  ('Rohit Bhasin',       'rohit.bhasin@demo.phera.io',       '+919800000080', '#A5D6A7', 'rohit',       'bottts',  'groom'),
  ('Lata Chopra',        'lata.chopra@demo.phera.io',        '+919800000081', '#CE93D8', 'lata',        'lorelei', 'bride'),
  ('Vinod Sahai',        'vinod.sahai@demo.phera.io',        '+919800000082', '#90CAF9', 'vinod',       'bottts',  'groom'),
  ('Komal Sehgal',       'komal.sehgal@demo.phera.io',       '+919800000083', '#F8BBD0', 'komal',       'lorelei', 'bride'),
  ('Anurag Batra',       'anurag.batra@demo.phera.io',       '+919800000084', '#FFE082', 'anurag',      'bottts',  'groom'),
  ('Simran Ahuja',       'simran.ahuja@demo.phera.io',       '+919800000085', '#E1BEE7', 'simran',      'lorelei', 'bride'),
  ('Mayank Dua',         'mayank.dua@demo.phera.io',         '+919800000086', '#B2DFDB', 'mayank',      'bottts',  'groom'),
  ('Preeti Sodhi',       'preeti.sodhi@demo.phera.io',       '+919800000087', '#F48FB1', 'preeti',      'lorelei', 'bride'),
  ('Tushar Kohli',       'tushar.kohli@demo.phera.io',       '+919800000088', '#BBDEFB', 'tushar',      'bottts',  'groom'),
  ('Neelam Bajpai',      'neelam.bajpai@demo.phera.io',      '+919800000089', '#E1BEE7', 'neelam',      'lorelei', 'bride'),
  ('Abhishek Randhawa',  'abhishek.randhawa@demo.phera.io',  '+919800000090', '#C8E6C9', 'abhishek',    'bottts',  'groom'),
  ('Garima Kashyap',     'garima.kashyap@demo.phera.io',     '+919800000091', '#F06292', 'garima',      'lorelei', 'bride'),
  ('Naveen Malhotra',    'naveen.malhotra@demo.phera.io',    '+919800000092', '#81D4FA', 'naveen',      'bottts',  'groom'),
  ('Seema Dhingra',      'seema.dhingra@demo.phera.io',      '+919800000093', '#CE93D8', 'seema',       'lorelei', 'bride'),
  ('Ashok Juneja',       'ashok.juneja@demo.phera.io',       '+919800000094', '#FFCC80', 'ashok',       'bottts',  'groom'),
  ('Hema Shukla',        'hema.shukla@demo.phera.io',        '+919800000095', '#F48FB1', 'hema',        'lorelei', 'bride'),
  ('Sameer Kapoor',      'sameer.kapoor@demo.phera.io',      '+919800000096', '#80CBC4', 'sameer',      'bottts',  'groom'),
  ('Veena Manchanda',    'veena.manchanda@demo.phera.io',    '+919800000097', '#EF9A9A', 'veena',       'lorelei', 'bride'),
  ('Raghav Anand',       'raghav.anand@demo.phera.io',       '+919800000098', '#90A4AE', 'raghav',      'bottts',  'groom'),
  ('Poonam Lamba',       'poonam.lamba@demo.phera.io',       '+919800000099', '#F48FB1', 'poonam',      'lorelei', 'bride'),
  ('Ishaan Bhargava',    'ishaan.bhargava@demo.phera.io',    '+919800000100', '#A5D6A7', 'ishaan',      'bottts',  'groom'),
  ('Manju Pahwa',        'manju.pahwa@demo.phera.io',        '+919800000101', '#CE93D8', 'manju',       'lorelei', 'bride'),
  ('Vikrant Sahni',      'vikrant.sahni@demo.phera.io',      '+919800000102', '#90CAF9', 'vikrant',     'bottts',  'groom'),
  ('Jyoti Wadhwa',       'jyoti.wadhwa@demo.phera.io',       '+919800000103', '#F8BBD0', 'jyoti',       'lorelei', 'bride'),
  ('Rakesh Bedi',        'rakesh.bedi@demo.phera.io',        '+919800000104', '#FFE082', 'rakesh',      'bottts',  'groom'),
  ('Alka Chawla',        'alka.chawla@demo.phera.io',        '+919800000105', '#E1BEE7', 'alka',        'lorelei', 'bride'),
  ('Sunil Tandon',       'sunil.tandon@demo.phera.io',       '+919800000106', '#B2DFDB', 'sunil',       'bottts',  'groom'),
  ('Rupal Garg',         'rupal.garg@demo.phera.io',         '+919800000107', '#F48FB1', 'rupal',       'lorelei', 'bride'),
  ('Aman Bindra',        'aman.bindra@demo.phera.io',        '+919800000108', '#BBDEFB', 'aman',        'bottts',  'groom'),
  ('Kanchan Dutta',      'kanchan.dutta@demo.phera.io',      '+919800000109', '#E1BEE7', 'kanchan',     'lorelei', 'bride'),
  ('Nitin Bahl',         'nitin.bahl@demo.phera.io',         '+919800000110', '#C8E6C9', 'nitin',       'bottts',  'groom'),
  ('Sonali Mathur',      'sonali.mathur@demo.phera.io',      '+919800000111', '#F06292', 'sonali',      'lorelei', 'bride'),
  ('Kartik Varma',       'kartik.varma@demo.phera.io',       '+919800000112', '#81D4FA', 'kartik',      'bottts',  'groom'),
  ('Roshni Tiwari',      'roshni.tiwari@demo.phera.io',      '+919800000113', '#CE93D8', 'roshni',      'lorelei', 'bride'),
  ('Ankit Lal',          'ankit.lal@demo.phera.io',          '+919800000114', '#FFCC80', 'ankit',       'bottts',  'groom'),
  ('Smita Gokhale',      'smita.gokhale@demo.phera.io',      '+919800000115', '#F48FB1', 'smita',       'lorelei', 'bride'),
  ('Vikas Madan',        'vikas.madan@demo.phera.io',        '+919800000116', '#80CBC4', 'vikas',       'bottts',  'groom'),
  ('Deepika Sen',        'deepika.sen@demo.phera.io',        '+919800000117', '#EF9A9A', 'deepika',     'lorelei', 'bride'),
  ('Manoj Chandra',      'manoj.chandra@demo.phera.io',      '+919800000118', '#90A4AE', 'manoj',       'bottts',  'groom'),
  ('Archana Bakshi',     'archana.bakshi@demo.phera.io',     '+919800000119', '#F48FB1', 'archana',     'lorelei', 'bride'),
  ('Harsh Vardhan',      'harsh.vardhan@demo.phera.io',      '+919800000120', '#A5D6A7', 'harshv',      'bottts',  'groom'),
  ('Sweta Johar',        'sweta.johar@demo.phera.io',        '+919800000121', '#CE93D8', 'sweta',       'lorelei', 'bride'),
  ('Nirmal Grewal',      'nirmal.grewal@demo.phera.io',      '+919800000122', '#90CAF9', 'nirmal',      'bottts',  'groom'),
  ('Chhavi Rastogi',     'chhavi.rastogi@demo.phera.io',     '+919800000123', '#F8BBD0', 'chhavi',      'lorelei', 'bride'),
  ('Kamal Narang',       'kamal.narang@demo.phera.io',       '+919800000124', '#FFE082', 'kamal',       'bottts',  'groom'),
  ('Yamini Bhat',        'yamini.bhat@demo.phera.io',        '+919800000125', '#E1BEE7', 'yamini',      'lorelei', 'bride'),
  ('Sudhir Vohra',       'sudhir.vohra@demo.phera.io',       '+919800000126', '#B2DFDB', 'sudhir',      'bottts',  'groom'),
  ('Payal Seghal',       'payal.seghal@demo.phera.io',       '+919800000127', '#F48FB1', 'payal',       'lorelei', 'bride'),
  ('Om Prakash',         'om.prakash@demo.phera.io',         '+919800000128', '#BBDEFB', 'om',          'bottts',  'groom'),
  ('Naina Kohli',        'naina.kohli@demo.phera.io',        '+919800000129', '#E1BEE7', 'naina',       'lorelei', 'bride'),
  ('Gaurav Sandhu',      'gaurav.sandhu@demo.phera.io',      '+919800000130', '#C8E6C9', 'gauravs',     'bottts',  'groom'),
  ('Tanu Malik',         'tanu.malik@demo.phera.io',         '+919800000131', '#F06292', 'tanu',        'lorelei', 'bride'),
  ('Sahil Wahi',         'sahil.wahi@demo.phera.io',         '+919800000132', '#81D4FA', 'sahil',       'bottts',  'groom'),
  ('Madhuri Lele',       'madhuri.lele@demo.phera.io',       '+919800000133', '#CE93D8', 'madhuri',     'lorelei', 'bride'),
  ('Surinder Dhillon',   'surinder.dhillon@demo.phera.io',   '+919800000134', '#FFCC80', 'surinder',    'bottts',  'groom'),
  ('Radha Iyer',         'radha.iyer@demo.phera.io',         '+919800000135', '#F48FB1', 'radha',       'lorelei', 'bride'),
  ('Brijesh Suri',       'brijesh.suri@demo.phera.io',       '+919800000136', '#80CBC4', 'brijesh',     'bottts',  'groom'),
  ('Vaishali Dua',       'vaishali.dua@demo.phera.io',       '+919800000137', '#EF9A9A', 'vaishali',    'lorelei', 'bride'),
  ('Jugal Kishore',      'jugal.kishore@demo.phera.io',      '+919800000138', '#90A4AE', 'jugal',       'bottts',  'groom'),
  ('Promila Bhalla',     'promila.bhalla@demo.phera.io',     '+919800000139', '#F48FB1', 'promila',     'lorelei', 'bride'),
  ('Trilok Chand',       'trilok.chand@demo.phera.io',       '+919800000140', '#A5D6A7', 'trilok',      'bottts',  'groom'),
  ('Charu Nigam',        'charu.nigam@demo.phera.io',        '+919800000141', '#CE93D8', 'charu',       'lorelei', 'bride'),
  ('Darshan Punj',       'darshan.punj@demo.phera.io',       '+919800000142', '#90CAF9', 'darshan',     'bottts',  'groom'),
  ('Ekta Saran',         'ekta.saran@demo.phera.io',         '+919800000143', '#F8BBD0', 'ekta',        'lorelei', 'bride'),
  ('Farhan Qureshi',     'farhan.qureshi@demo.phera.io',     '+919800000144', '#FFE082', 'farhan',      'bottts',  'groom'),
  ('Gauri Pathak',       'gauri.pathak@demo.phera.io',       '+919800000145', '#E1BEE7', 'gauri',       'lorelei', 'bride'),
  ('Harpreet Sandhu',    'harpreet.sandhu@demo.phera.io',    '+919800000146', '#B2DFDB', 'harpreet',    'bottts',  'groom'),
  ('Indu Sharma',        'indu.sharma@demo.phera.io',        '+919800000147', '#F48FB1', 'indu',        'lorelei', 'bride'),
  ('Jagdish Prasad',     'jagdish.prasad@demo.phera.io',     '+919800000148', '#BBDEFB', 'jagdish',     'bottts',  'groom'),
  ('Kriti Malhotra',     'kriti.malhotra@demo.phera.io',     '+919800000149', '#E1BEE7', 'kriti',       'lorelei', 'bride'),
  ('Lucky Sidhu',        'lucky.sidhu@demo.phera.io',        '+919800000150', '#C8E6C9', 'lucky',       'bottts',  'groom')
) AS g(name, email, phone, avatar_color, avatar_seed, avatar_style, wedding_side)
WHERE w.slug = 'demo-template'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 2. RSVPs (~150 guests × events, realistic distribution)
--    ~100 yes, ~25 no, ~25 maybe for event 0
--    ~85 yes, ~15 no, ~10 maybe, rest didn't RSVP for event 1
-- ============================================================
INSERT INTO rsvps (wedding_id, event_id, guest_id, attending, plus_one, plus_one_name, guest_count, food_preference, dietary_restrictions, song_request, special_message, maybe_comment)
SELECT 'demo-template', 'general', g.id,
  r.attending, r.plus_one, r.plus_one_name, r.guest_count,
  r.food_preference::text[], r.dietary_restrictions, r.song_request, r.special_message, r.maybe_comment
FROM weddings w
JOIN guests g ON g.wedding_id = 'demo-template'
JOIN (VALUES
  -- ===== EVENT 0 (Main ceremony/Sangeet) — 150 RSVPs =====
  -- YES responses (~100)
  ('Priya Sharma',       0, 'yes',   true,  'Rahul Sharma',      2, '{vegetarian}',       NULL,                    'Tum Hi Ho',           'So excited for this!',                    NULL),
  ('Arjun Patel',        0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Gallan Goodiyan',     'Wouldn''t miss it!',                      NULL),
  ('Ananya Mehta',       0, 'yes',   true,  'Dev Mehta',         2, '{vegan}',            'Nut allergy',           'Nachde Ne Saare',     'Can''t wait to dance!',                   NULL),
  ('Rohan Kapoor',       0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'London Thumakda',     'Let''s go Bangkok!',                      NULL),
  ('Diya Nair',          0, 'yes',   false, NULL,                1, '{vegetarian}',       'Gluten free',           'Raataan Lambiyan',    'Love you both!',                          NULL),
  ('Kavya Iyer',         0, 'yes',   true,  'Neel Iyer',        2, '{vegetarian}',       NULL,                    'Kala Chashma',        'The venue looks AMAZING',                 NULL),
  ('Aditya Reddy',       0, 'yes',   false, NULL,                1, '{non-vegetarian}',   'No shellfish',          'Dil Dhadakne Do',     NULL,                                      NULL),
  ('Karan Malhotra',     0, 'yes',   true,  'Simran Malhotra',  2, '{vegetarian,jain}',  'Jain — no onion/garlic','Balam Pichkari',      'Our whole family is thrilled!',            NULL),
  ('Isha Gupta',         0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Ainvayi Ainvayi',     'Booked my flights already!',              NULL),
  ('Neha Bhatia',        0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Channa Mereya',       'This is going to be magical!',            NULL),
  ('Siddharth Das',      0, 'yes',   true,  'Pooja Das',        2, '{non-vegetarian}',   NULL,                    'Badtameez Dil',       NULL,                                      NULL),
  ('Tara Choudhury',     0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Cutiepie',            'Thailand wedding — dream come true!',     NULL),
  ('Riya Deshmukh',      0, 'yes',   true,  'Nikhil Deshmukh',  2, '{non-vegetarian}',   NULL,                    'Kar Gayi Chull',      'We are SO ready for Bangkok!',            NULL),
  ('Vivek Agarwal',      0, 'yes',   false, NULL,                1, '{vegetarian}',       'Lactose intolerant',    'Desi Girl',           'Let''s make it memorable!',               NULL),
  ('Sunita Sharma',      0, 'yes',   true,  'Rajendra Sharma',  2, '{vegetarian}',       NULL,                    NULL,                  'My baby is getting married!',             NULL),
  ('Vijay Patel',        0, 'yes',   true,  'Meena Patel',      2, '{vegetarian}',       NULL,                    NULL,                  'So proud of our son',                     NULL),
  ('Nandini Rao',        0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Maahi Ve',            'College crew reunited!',                  NULL),
  ('Harsh Trivedi',      0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Senorita',            NULL,                                      NULL),
  ('Pooja Kulkarni',     0, 'yes',   true,  'Sameer Kulkarni',  2, '{vegetarian}',       NULL,                    'Aaj Ki Raat',         'So happy for you both!',                  NULL),
  ('Manish Tiwari',      0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Chaiyya Chaiyya',     'Bro your wedding is going to be epic',    NULL),
  ('Swati Pillai',       0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Nagada Sang Dhol',    NULL,                                      NULL),
  ('Deepak Jain',        0, 'yes',   true,  'Rina Jain',        2, '{vegetarian,jain}',  'Strict Jain diet',      NULL,                  NULL,                                      NULL),
  ('Ankita Mishra',      0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Ghagra',              'Priya deserves the best!',                NULL),
  ('Rajesh Khanna',      0, 'yes',   true,  'Suman Khanna',     2, '{non-vegetarian}',   NULL,                    NULL,                  'We''ll be there with bells on',           NULL),
  ('Divya Menon',        0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Pinga',               'First time in Thailand!',                 NULL),
  ('Suresh Pandey',      0, 'yes',   false, NULL,                1, '{vegetarian}',       'No spicy food',         NULL,                  NULL,                                      NULL),
  ('Shreya Chatterjee',  0, 'yes',   true,  'Arnab Chatterjee', 2, '{non-vegetarian}',   NULL,                    'Deewani Mastani',     'Can''t wait!',                            NULL),
  ('Nikhil Sinha',       0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Malhari',             'Boys trip + wedding = perfect combo',     NULL),
  ('Pallavi Deshpande',  0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Dilliwali Girlfriend','Love from Pune!',                         NULL),
  ('Gaurav Bhatt',       0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Amplifier',           NULL,                                      NULL),
  ('Ritika Soni',        0, 'yes',   true,  'Arjun Soni',       2, '{vegetarian}',       NULL,                    'Saturday Saturday',   'Hotel booked!',                           NULL),
  ('Varun Chauhan',      0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Jumme Ki Raat',       NULL,                                      NULL),
  ('Nisha Rajan',        0, 'yes',   false, NULL,                1, '{vegetarian}',       'Nut allergy',           'Banno',               'Love love love!',                         NULL),
  ('Ashish Dubey',       0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Tanvi Hegde',        0, 'yes',   true,  'Rahul Hegde',      2, '{vegetarian}',       NULL,                    'Laal Ishq',           'Bringing my dance shoes!',                NULL),
  ('Kunal Sethi',        0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Desi Boyz',           'Bangkok baby!',                           NULL),
  ('Aditi Banerjee',     0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Barso Re',            NULL,                                      NULL),
  ('Pranav Thakur',      0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Abhi Toh Party',      'Count me in',                             NULL),
  ('Megha Awasthi',      0, 'yes',   true,  'Ravi Awasthi',     2, '{vegetarian}',       NULL,                    'Kabira',              'Our 4th wedding this year haha',          NULL),
  ('Rahul Dixit',        0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Swag Se Swagat',      NULL,                                      NULL),
  ('Shalini Bose',       0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Ghoomar',             'Sending so much love!',                   NULL),
  ('Ajay Chauhan',       0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Bhavna Khurana',     0, 'yes',   true,  'Vishal Khurana',   2, '{vegetarian}',       NULL,                    'Morni Banke',         'We wouldn''t miss this!',                 NULL),
  ('Mohit Aggarwal',     0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Sapna Jahan',         NULL,                                      NULL),
  ('Sakshi Luthra',      0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Radha',               'Best couple ever!',                       NULL),
  ('Dev Anand',          0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Galti Se Mistake',    'What a way to celebrate!',                NULL),
  ('Jaya Krishnan',      0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Saree Ke Fall Sa',    NULL,                                      NULL),
  ('Pankaj Mehra',       0, 'yes',   true,  'Kavita Mehra',     2, '{non-vegetarian}',   NULL,                    NULL,                  'On behalf of both families',              NULL),
  ('Lalita Vyas',        0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Chikni Chameli',      NULL,                                      NULL),
  ('Sanjay Gill',        0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  'Looking forward to it',                   NULL),
  ('Geeta Narayan',      0, 'yes',   true,  'Suresh Narayan',   2, '{vegetarian}',       NULL,                    'Bole Chudiyan',       'Blessings from aunty!',                   NULL),
  ('Ramesh Ahuja',       0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Usha Bhargava',      0, 'yes',   false, NULL,                1, '{vegetarian}',       'Diabetic diet',         NULL,                  'God bless you both',                      NULL),
  ('Navin Oberoi',       0, 'yes',   true,  'Prerna Oberoi',    2, '{non-vegetarian}',   NULL,                    'Dil Se',              NULL,                                      NULL),
  ('Rekha Tandon',       0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Nimbooda',            NULL,                                      NULL),
  ('Anil Chadha',        0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  'Will try to get early flight',            NULL),
  ('Kamini Srivastava',  0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Mehendi Laga Ke Rakhna', NULL,                                   NULL),
  ('Hemant Grover',      0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Vandana Kapur',      0, 'yes',   true,  'Rajan Kapur',      2, '{vegetarian}',       NULL,                    'Makhna',              'Coming from London specially!',            NULL),
  ('Tarun Bajaj',        0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Badri Ki Dulhania',   NULL,                                      NULL),
  ('Shikha Dhawan',      0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Baby Doll',           'First destination wedding!',              NULL),
  ('Piyush Goel',        0, 'yes',   false, NULL,                1, '{vegetarian}',       'No onion/garlic',       NULL,                  NULL,                                      NULL),
  ('Mala Saini',         0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Tenu Leke',           NULL,                                      NULL),
  ('Girish Vohra',       0, 'yes',   true,  'Sunanda Vohra',    2, '{non-vegetarian}',   NULL,                    NULL,                  'Both of us are coming!',                  NULL),
  ('Chitra Mahajan',     0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Aaj Ki Party',        'Yay yay yay!',                            NULL),
  ('Yash Taneja',        0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Tune Maari Entriyaan',NULL,                                      NULL),
  ('Sonia Arora',        0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Afghan Jalebi',       NULL,                                      NULL),
  ('Lalit Walia',        0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Padma Venkatesh',    0, 'yes',   true,  'Hari Venkatesh',   2, '{vegetarian}',       NULL,                    'Odhani',              'Congratulations dear!',                   NULL),
  ('Dinesh Khatri',      0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'High Heels',          NULL,                                      NULL),
  ('Aparna Sundaram',    0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Sun Saathiya',        'Made in heaven!',                         NULL),
  ('Mukesh Mittal',      0, 'yes',   false, NULL,                1, '{vegetarian}',       'Jain',                  NULL,                  NULL,                                      NULL),
  ('Renu Thapar',        0, 'yes',   true,  'Ashok Thapar',     2, '{vegetarian}',       NULL,                    NULL,                  'Aunty-uncle are SO happy!',               NULL),
  ('Saurabh Khosla',     0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Lat Lag Gayee',       NULL,                                      NULL),
  ('Aarti Purohit',      0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Iski Uski',           'Can''t stop smiling about this wedding!', NULL),
  ('Rohit Bhasin',       0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Manma Emotion Jaage', NULL,                                      NULL),
  ('Lata Chopra',        0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Dhoom Machale',       NULL,                                      NULL),
  ('Vinod Sahai',        0, 'yes',   true,  'Rita Sahai',       2, '{vegetarian}',       NULL,                    NULL,                  'From all of us in Lucknow',               NULL),
  ('Komal Sehgal',       0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Gallan Goodiyan',     NULL,                                      NULL),
  ('Anurag Batra',       0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Party All Night',     'LESSGOOO',                                NULL),
  ('Simran Ahuja',       0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'London Thumakda',     'So so happy!',                            NULL),
  ('Mayank Dua',         0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Preeti Sodhi',       0, 'yes',   true,  'Ravi Sodhi',       2, '{vegetarian}',       NULL,                    'Balle Balle',         NULL,                                      NULL),
  ('Tushar Kohli',       0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Khalibali',           'College gang assemble!',                  NULL),
  ('Neelam Bajpai',      0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Rang De Basanti',     NULL,                                      NULL),
  ('Abhishek Randhawa',  0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Jhoome Jo Pathaan',   'Sardar ji is ready!',                     NULL),
  ('Garima Kashyap',     0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Laung Da Lashkara',   NULL,                                      NULL),
  ('Naveen Malhotra',    0, 'yes',   true,  'Pooja Malhotra',   2, '{non-vegetarian}',   NULL,                    NULL,                  'Bringing the whole crew',                 NULL),
  ('Seema Dhingra',      0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Dola Re Dola',        'Best wishes!',                            NULL),
  ('Ashok Juneja',       0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Hema Shukla',        0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Udi Udi Jaye',        NULL,                                      NULL),
  ('Sameer Kapoor',      0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Gerua',               'Let''s tear up the dance floor!',         NULL),
  ('Veena Manchanda',    0, 'yes',   true,  'Raj Manchanda',    2, '{vegetarian}',       NULL,                    NULL,                  'Congratulations beta!',                   NULL),
  ('Raghav Anand',       0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Nashe Si Chadh Gayi', NULL,                                      NULL),
  ('Poonam Lamba',       0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    'Ranjha',              NULL,                                      NULL),
  ('Ishaan Bhargava',    0, 'yes',   false, NULL,                1, '{non-vegetarian}',   'Halal only',            'Zingaat',             NULL,                                      NULL),
  ('Manju Pahwa',        0, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  'Blessings and love',                      NULL),
  ('Vikrant Sahni',      0, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    'Hauli Hauli',         NULL,                                      NULL),
  ('Jyoti Wadhwa',       0, 'yes',   true,  'Sandeep Wadhwa',   2, '{vegetarian}',       NULL,                    'Mehndi Hai Rachne Wali', 'Bringing our mehndi outfits!',         NULL),

  -- MAYBE responses (~25)
  ('Vikram Singh',       0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Waiting on work approval, will confirm by next week'),
  ('Raj Verma',          0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Checking if I can get time off — will update soon!'),
  ('Rakesh Bedi',        0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Passport renewal in progress — fingers crossed'),
  ('Alka Chawla',        0, 'maybe', false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      'Depends on my daughter''s exam schedule'),
  ('Sunil Tandon',       0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Business trip might overlap — trying to reschedule'),
  ('Rupal Garg',         0, 'maybe', false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      'Baby is due around that time! Will know in 2 weeks'),
  ('Aman Bindra',        0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Checking flight costs — budget is tight'),
  ('Kanchan Dutta',      0, 'maybe', false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      'Need to sort visa situation, will let you know'),
  ('Nitin Bahl',         0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Might have a conference that week'),
  ('Sonali Mathur',      0, 'maybe', false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      'Trying to swap shifts at the hospital'),
  ('Kartik Varma',       0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Wife is pregnant, depends on doctor''s clearance'),
  ('Roshni Tiwari',      0, 'maybe', false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      'Waiting for my passport to arrive'),
  ('Ankit Lal',          0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Have a prior commitment, trying to move it'),
  ('Smita Gokhale',      0, 'maybe', false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      'Need to check with in-laws about travel'),
  ('Vikas Madan',        0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Project deadline might conflict'),
  ('Deepika Sen',        0, 'maybe', false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      'Waiting on leave approval'),
  ('Manoj Chandra',      0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Might have surgery scheduled that week'),
  ('Archana Bakshi',     0, 'maybe', false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      'Depends if I can find someone to watch the kids'),
  ('Harsh Vardhan',      0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Checking with my team — startup life is unpredictable'),
  ('Sweta Johar',        0, 'maybe', false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      'Will know after my appraisal meeting next week'),
  ('Nirmal Grewal',      0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Visa processing is taking longer than expected'),
  ('Chhavi Rastogi',     0, 'maybe', false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      'Have a family wedding same week — trying to do both!'),
  ('Kamal Narang',       0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Need to check school calendar for my kids'),
  ('Yamini Bhat',        0, 'maybe', false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      'Hoping I can make it work!'),
  ('Sudhir Vohra',       0, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Court hearing might get postponed to that date'),

  -- NO responses (~25)
  ('Meera Joshi',        0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'So sorry — prior commitment. Will celebrate when you''re back!', NULL),
  ('Amit Saxena',        0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Passport renewal got delayed — devastated to miss this',         NULL),
  ('Payal Seghal',       0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Just had a baby — can''t travel. Sending all our love!',         NULL),
  ('Om Prakash',         0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Health doesn''t permit travel right now. Blessings!',            NULL),
  ('Naina Kohli',        0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'MBA exams that exact week — so upset!',                          NULL),
  ('Gaurav Sandhu',      0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Already committed to another wedding that weekend',              NULL),
  ('Tanu Malik',         0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Visa got rejected unfortunately. Will send a gift!',             NULL),
  ('Sahil Wahi',         0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Work won''t let me take leave that week',                        NULL),
  ('Madhuri Lele',       0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Daughter''s board exams — can''t leave her alone',               NULL),
  ('Surinder Dhillon',   0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Knee surgery recovery — doctor says no flying',                  NULL),
  ('Radha Iyer',         0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Financial constraints this year. Heartbroken to miss it',        NULL),
  ('Brijesh Suri',       0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Sister''s wedding is the same week — family first!',             NULL),
  ('Vaishali Dua',       0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Pregnant and doctor advised against flying. Love you!',          NULL),
  ('Jugal Kishore',      0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Business launch that week — terrible timing',                    NULL),
  ('Promila Bhalla',     0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Mother-in-law is unwell, can''t leave her',                      NULL),
  ('Trilok Chand',       0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Government posting doesn''t allow international travel right now', NULL),
  ('Charu Nigam',        0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Teaching exams that week. Wishing you both the absolute best!',  NULL),
  ('Darshan Punj',       0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Can''t get passport in time. Celebrate for me!',                 NULL),
  ('Ekta Saran',         0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Just started a new job — no leave yet. So sorry!',              NULL),
  ('Farhan Qureshi',     0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Family emergency came up. Will make it up to you!',             NULL),
  ('Gauri Pathak',       0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Toddler is too young for the trip. Next time!',                 NULL),
  ('Harpreet Sandhu',    0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Farm season — can''t leave right now',                           NULL),
  ('Indu Sharma',        0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Recovering from COVID — doctor said no travel for a month',     NULL),
  ('Jagdish Prasad',     0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Son''s school admission interviews that week',                  NULL),
  ('Kriti Malhotra',     0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Budget is too tight for international trip. Miss you!',         NULL),
  ('Lucky Sidhu',        0, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Military posting — leave not approved. Jai Hind and congrats!', NULL),

  -- ===== EVENT 1 (Reception/Day 2) — RSVPs from those who said yes to event 0 =====
  ('Priya Sharma',       1, 'yes',   true,  'Rahul Sharma',     2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Arjun Patel',        1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Ananya Mehta',       1, 'yes',   true,  'Dev Mehta',        2, '{vegan}',            'Nut allergy',           NULL,                  NULL,                                      NULL),
  ('Rohan Kapoor',       1, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Have a flight back sadly',                NULL),
  ('Diya Nair',          1, 'yes',   false, NULL,                1, '{vegetarian}',       'Gluten free',           NULL,                  NULL,                                      NULL),
  ('Kavya Iyer',         1, 'yes',   true,  'Neel Iyer',        2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Aditya Reddy',       1, 'yes',   false, NULL,                1, '{non-vegetarian}',   'No shellfish',          NULL,                  NULL,                                      NULL),
  ('Karan Malhotra',     1, 'yes',   true,  'Simran Malhotra',  2, '{vegetarian,jain}',  'Jain — no onion/garlic',NULL,                  NULL,                                      NULL),
  ('Isha Gupta',         1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Neha Bhatia',        1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Siddharth Das',      1, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Early flight next day',                   NULL),
  ('Tara Choudhury',     1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Riya Deshmukh',      1, 'yes',   true,  'Nikhil Deshmukh',  2, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Vivek Agarwal',      1, 'maybe', false, NULL,                1, '{vegetarian}',       'Lactose intolerant',    NULL,                  NULL,                                      'Will try my best to stay for this one'),
  ('Sunita Sharma',      1, 'yes',   true,  'Rajendra Sharma',  2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Vijay Patel',        1, 'yes',   true,  'Meena Patel',      2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Nandini Rao',        1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Harsh Trivedi',      1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Pooja Kulkarni',     1, 'yes',   true,  'Sameer Kulkarni',  2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Manish Tiwari',      1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Swati Pillai',       1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Deepak Jain',        1, 'yes',   true,  'Rina Jain',        2, '{vegetarian,jain}',  'Strict Jain diet',      NULL,                  NULL,                                      NULL),
  ('Ankita Mishra',      1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Rajesh Khanna',      1, 'yes',   true,  'Suman Khanna',     2, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Divya Menon',        1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Suresh Pandey',      1, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Flying back that evening',                NULL),
  ('Shreya Chatterjee',  1, 'yes',   true,  'Arnab Chatterjee', 2, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Nikhil Sinha',       1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Pallavi Deshpande',  1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Gaurav Bhatt',       1, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Have to leave for Mumbai early morning',  NULL),
  ('Ritika Soni',        1, 'yes',   true,  'Arjun Soni',       2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Varun Chauhan',      1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Nisha Rajan',        1, 'yes',   false, NULL,                1, '{vegetarian}',       'Nut allergy',           NULL,                  NULL,                                      NULL),
  ('Ashish Dubey',       1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Tanvi Hegde',        1, 'yes',   true,  'Rahul Hegde',      2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Kunal Sethi',        1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Aditi Banerjee',     1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Pranav Thakur',      1, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Need to catch my flight',                 NULL),
  ('Megha Awasthi',      1, 'yes',   true,  'Ravi Awasthi',     2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Rahul Dixit',        1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Shalini Bose',       1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Ajay Chauhan',       1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Bhavna Khurana',     1, 'yes',   true,  'Vishal Khurana',   2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Mohit Aggarwal',     1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Sakshi Luthra',      1, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Flight is early next morning',            NULL),
  ('Dev Anand',          1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Jaya Krishnan',      1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Pankaj Mehra',       1, 'yes',   true,  'Kavita Mehra',     2, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Lalita Vyas',        1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Sanjay Gill',        1, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Client meeting in Singapore next morning', NULL),
  ('Geeta Narayan',      1, 'yes',   true,  'Suresh Narayan',   2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Ramesh Ahuja',       1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Usha Bhargava',      1, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Need to rest — long day for me',          NULL),
  ('Navin Oberoi',       1, 'yes',   true,  'Prerna Oberoi',    2, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Rekha Tandon',       1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Anil Chadha',        1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Kamini Srivastava',  1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Hemant Grover',      1, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Early morning departure',                 NULL),
  ('Vandana Kapur',      1, 'yes',   true,  'Rajan Kapur',      2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Tarun Bajaj',        1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Shikha Dhawan',      1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Piyush Goel',        1, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Have to catch red-eye flight home',       NULL),
  ('Mala Saini',         1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Girish Vohra',       1, 'yes',   true,  'Sunanda Vohra',    2, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Chitra Mahajan',     1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Yash Taneja',        1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Sonia Arora',        1, 'maybe', false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      'Might be too tired after day 1 — will see!'),
  ('Lalit Walia',        1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Padma Venkatesh',    1, 'yes',   true,  'Hari Venkatesh',   2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Dinesh Khatri',      1, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Return flight that afternoon',            NULL),
  ('Aparna Sundaram',    1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Mukesh Mittal',      1, 'yes',   false, NULL,                1, '{vegetarian}',       'Jain',                  NULL,                  NULL,                                      NULL),
  ('Renu Thapar',        1, 'yes',   true,  'Ashok Thapar',     2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Saurabh Khosla',     1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Aarti Purohit',      1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Rohit Bhasin',       1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Lata Chopra',        1, 'maybe', false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      'Depends on how I feel — it''s a long trip!'),
  ('Vinod Sahai',        1, 'yes',   true,  'Rita Sahai',       2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Komal Sehgal',       1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Anurag Batra',       1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Simran Ahuja',       1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Mayank Dua',         1, 'maybe', false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      'Jet lag might hit hard — 50/50'),
  ('Preeti Sodhi',       1, 'yes',   true,  'Ravi Sodhi',       2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Tushar Kohli',       1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Neelam Bajpai',      1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Abhishek Randhawa',  1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Garima Kashyap',     1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Naveen Malhotra',    1, 'yes',   true,  'Pooja Malhotra',   2, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Seema Dhingra',      1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Ashok Juneja',       1, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Leaving early for work',                  NULL),
  ('Hema Shukla',        1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Sameer Kapoor',      1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Veena Manchanda',    1, 'yes',   true,  'Raj Manchanda',    2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Raghav Anand',       1, 'yes',   false, NULL,                1, '{non-vegetarian}',   NULL,                    NULL,                  NULL,                                      NULL),
  ('Poonam Lamba',       1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Ishaan Bhargava',    1, 'yes',   false, NULL,                1, '{non-vegetarian}',   'Halal only',            NULL,                  NULL,                                      NULL),
  ('Manju Pahwa',        1, 'yes',   false, NULL,                1, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL),
  ('Vikrant Sahni',      1, 'no',    false, NULL,                0, NULL,                 NULL,                    NULL,                  'Flight leaves that night',                NULL),
  ('Jyoti Wadhwa',       1, 'yes',   true,  'Sandeep Wadhwa',   2, '{vegetarian}',       NULL,                    NULL,                  NULL,                                      NULL)
) AS r(guest_name, event_idx, attending, plus_one, plus_one_name, guest_count, food_preference, dietary_restrictions, song_request, special_message, maybe_comment)
  ON g.name = r.guest_name
WHERE w.slug = 'demo-template'
  AND r.event_idx = 0
ON CONFLICT DO NOTHING;


-- ============================================================
-- 3. TRANSPORTATION
-- ============================================================

-- 3a. Transportation Settings
INSERT INTO transportation_settings (wedding_id, arrival_configured, departure_configured)
SELECT id, true, true FROM weddings WHERE slug = 'demo-template'
ON CONFLICT DO NOTHING;

-- 3b. Vehicle Types
INSERT INTO transportation_vehicle_types (wedding_id, name, capacity)
SELECT w.id, vt.name, vt.capacity
FROM weddings w,
(VALUES
  ('Luxury Minibus',  20),
  ('Private Van',      8),
  ('Sedan',            4)
) AS vt(name, capacity)
WHERE w.slug = 'demo-template'
ON CONFLICT DO NOTHING;

-- 3c. Pickup Locations
INSERT INTO transportation_pickup_locations (wedding_id, direction, name, address, order_index)
SELECT w.id, pl.direction, pl.name, pl.address, pl.order_index
FROM weddings w,
(VALUES
  ('arrival',   'Suvarnabhumi Airport (BKK)',     'Suvarnabhumi Airport, Bangkok, Thailand',             0),
  ('arrival',   'Don Mueang Airport (DMK)',       'Don Mueang International Airport, Bangkok, Thailand', 1),
  ('arrival',   'Mandarin Oriental Bangkok',      'Mandarin Oriental, 48 Oriental Ave, Bangkok 10500',   2),
  ('departure', 'The Siam Hotel (Wedding Venue)', 'The Siam Hotel, 3/2 Thanon Khao, Bangkok 10300',      0),
  ('departure', 'Mandarin Oriental Bangkok',      'Mandarin Oriental, 48 Oriental Ave, Bangkok 10500',   1)
) AS pl(direction, name, address, order_index)
WHERE w.slug = 'demo-template'
ON CONFLICT DO NOTHING;

-- 3d. Vehicles
INSERT INTO transportation_vehicles (wedding_id, direction, vehicle_name, capacity, departure_datetime, pickup_location, dropoff_location, order_index)
SELECT w.id, v.direction, v.vehicle_name, v.capacity, v.departure_datetime::timestamptz, v.pickup_location, v.dropoff_location, v.order_index
FROM weddings w,
(VALUES
  ('arrival',   'Airport Shuttle A — Morning',   20, '2026-04-10T09:00:00', 'Suvarnabhumi Airport (BKK)',     'The Siam Hotel',             0),
  ('arrival',   'Airport Shuttle B — Afternoon',  20, '2026-04-10T14:00:00', 'Suvarnabhumi Airport (BKK)',     'The Siam Hotel',             1),
  ('arrival',   'Private Van — DMK Airport',       8, '2026-04-10T11:00:00', 'Don Mueang Airport (DMK)',       'The Siam Hotel',             2),
  ('arrival',   'Hotel Transfer — Oriental',       8, '2026-04-10T16:00:00', 'Mandarin Oriental Bangkok',      'The Siam Hotel',             3),
  ('departure', 'Morning Airport Drop',           20, '2026-04-13T08:00:00', 'The Siam Hotel (Wedding Venue)', 'Suvarnabhumi Airport (BKK)', 0),
  ('departure', 'Afternoon Airport Drop',         20, '2026-04-13T14:00:00', 'The Siam Hotel (Wedding Venue)', 'Suvarnabhumi Airport (BKK)', 1),
  ('departure', 'Hotel Transfer — Oriental',       8, '2026-04-13T10:00:00', 'The Siam Hotel (Wedding Venue)', 'Mandarin Oriental Bangkok',  2)
) AS v(direction, vehicle_name, capacity, departure_datetime, pickup_location, dropoff_location, order_index)
WHERE w.slug = 'demo-template'
ON CONFLICT DO NOTHING;

-- 3e. Reservations
INSERT INTO transportation_reservations (wedding_id, guest_id, direction, vehicle_id, pickup_location_id, party_size, status, notes)
SELECT w.id, g.id, r.direction, v.id, pl.id, r.party_size, r.status, r.notes
FROM weddings w
JOIN (VALUES
  ('Priya Sharma',       'arrival',   'Airport Shuttle A — Morning',   'Suvarnabhumi Airport (BKK)',     2, 'confirmed', 'Arriving with husband at 8:15 AM'),
  ('Ananya Mehta',       'arrival',   'Airport Shuttle A — Morning',   'Suvarnabhumi Airport (BKK)',     2, 'confirmed', NULL),
  ('Kavya Iyer',         'arrival',   'Airport Shuttle B — Afternoon', 'Suvarnabhumi Airport (BKK)',     2, 'confirmed', 'Flight lands at 1:30 PM'),
  ('Rohan Kapoor',       'arrival',   'Airport Shuttle B — Afternoon', 'Suvarnabhumi Airport (BKK)',     1, 'confirmed', NULL),
  ('Aditya Reddy',       'arrival',   'Private Van — DMK Airport',     'Don Mueang Airport (DMK)',       1, 'confirmed', 'Coming via AirAsia from Delhi'),
  ('Diya Nair',          'arrival',   'Hotel Transfer — Oriental',     'Mandarin Oriental Bangkok',      1, 'pending',   'Staying at Oriental, will confirm pickup time'),
  ('Karan Malhotra',     'arrival',   'Airport Shuttle A — Morning',   'Suvarnabhumi Airport (BKK)',     2, 'confirmed', 'With wife — early morning flight'),
  ('Isha Gupta',         'arrival',   'Airport Shuttle B — Afternoon', 'Suvarnabhumi Airport (BKK)',     1, 'confirmed', NULL),
  ('Riya Deshmukh',      'arrival',   'Airport Shuttle B — Afternoon', 'Suvarnabhumi Airport (BKK)',     2, 'pending',   'Still finalizing flight'),
  ('Shreya Chatterjee',  'arrival',   'Airport Shuttle A — Morning',   'Suvarnabhumi Airport (BKK)',     2, 'confirmed', 'Husband and I arriving together'),
  ('Rajesh Khanna',      'arrival',   'Airport Shuttle A — Morning',   'Suvarnabhumi Airport (BKK)',     2, 'confirmed', NULL),
  ('Nikhil Sinha',       'arrival',   'Airport Shuttle B — Afternoon', 'Suvarnabhumi Airport (BKK)',     1, 'confirmed', 'IndiGo flight from Mumbai'),
  ('Pooja Kulkarni',     'arrival',   'Private Van — DMK Airport',     'Don Mueang Airport (DMK)',       2, 'confirmed', 'AirAsia from Bangalore'),
  ('Priya Sharma',       'departure', 'Morning Airport Drop',          'The Siam Hotel (Wedding Venue)', 2, 'confirmed', 'Early morning flight home'),
  ('Kavya Iyer',         'departure', 'Afternoon Airport Drop',        'The Siam Hotel (Wedding Venue)', 2, 'confirmed', NULL),
  ('Aditya Reddy',       'departure', 'Morning Airport Drop',          'The Siam Hotel (Wedding Venue)', 1, 'confirmed', NULL),
  ('Diya Nair',          'departure', 'Hotel Transfer — Oriental',     'The Siam Hotel (Wedding Venue)', 1, 'pending',   'Staying extra night at Oriental'),
  ('Karan Malhotra',     'departure', 'Morning Airport Drop',          'The Siam Hotel (Wedding Venue)', 2, 'confirmed', NULL),
  ('Shreya Chatterjee',  'departure', 'Afternoon Airport Drop',        'The Siam Hotel (Wedding Venue)', 2, 'confirmed', NULL)
) AS r(guest_name, direction, vehicle_name, pickup_name, party_size, status, notes) ON true
JOIN guests g ON g.wedding_id = w.id::text AND g.name = r.guest_name
JOIN transportation_vehicles v ON v.wedding_id = w.id AND v.vehicle_name = r.vehicle_name
JOIN transportation_pickup_locations pl ON pl.wedding_id = w.id AND pl.name = r.pickup_name AND pl.direction = r.direction
WHERE w.slug = 'demo-template'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 4. CONCIERGE KNOWLEDGE BASE
-- ============================================================
INSERT INTO concierge_knowledge_base (wedding_id, title, content, category, source, is_active, order_index)
SELECT w.id, kb.title, kb.content, kb.category, kb.source, true, kb.order_index
FROM weddings w,
(VALUES
  ('Wedding Overview',
   'Priya & Arjun are getting married! The wedding is a 3-day celebration in Bangkok, Thailand from April 10-12, 2026. The couple chose Bangkok for its blend of vibrant culture, stunning venues, and world-class hospitality. It''s a destination wedding — most guests are traveling from India.',
   'general', 'manual', 0),
  ('Venue — The Siam Hotel',
   'All wedding events take place at The Siam Hotel, Bangkok (3/2 Thanon Khao, Vachirapayabal, Dusit, Bangkok 10300). Luxury riverside resort on the Chao Phraya River. Mehendi & Sangeet: Heritage Garden. Wedding Ceremony: Riverside Pavilion. Reception: Grand Ballroom. Contact: +66-2-206-6999.',
   'venue', 'manual', 1),
  ('Dress Code',
   'Mehendi & Sangeet (Day 1): Colorful Indian festive wear — bright lehengas, kurtas, or fusion outfits. Wedding Ceremony (Day 2): Traditional Indian formal — sarees, sherwanis, lehengas. Ladies: avoid red/maroon (reserved for bride). Reception (Day 2 evening): Black tie / cocktail glam — gowns, suits, or glamorous Indo-Western.',
   'general', 'manual', 2),
  ('Travel & Flights',
   'Most guests fly into Suvarnabhumi Airport (BKK). Budget flights arrive at Don Mueang Airport (DMK). Recommended: Thai Airways, IndiGo, Air India (direct from Delhi/Mumbai ~4hrs). Indian passport holders get Visa on Arrival (VOA) — 15 days, ~2000 THB. Bring passport photos and proof of accommodation.',
   'travel', 'manual', 3),
  ('Hotel Accommodations',
   'Room blocks arranged at: 1) The Siam Hotel (venue) — ₹18,000/night, code PRIYAARJUN for 15% off. 2) Mandarin Oriental — ₹15,000/night, 10 min from venue. 3) Riva Surya — ₹7,000/night, budget-friendly, riverside. Book directly or ask us for reservation links! Airport transfers arranged for Siam guests.',
   'accommodation', 'manual', 4),
  ('Bangkok Tips & Local Info',
   'Currency: Thai Baht (THB). 1 INR ≈ 0.44 THB. ATMs everywhere. Weather in April: Hot & humid (32-36°C) — pack light, breathable fabrics and sunscreen. Getting around: Grab (like Uber) is best. BTS Skytrain great for sightseeing. Tipping: 20-50 THB for restaurants. Language: Thai, but English widely spoken. Emergency: Tourist Police 1155.',
   'travel', 'manual', 5),
  ('Schedule — Day 1 (Apr 10): Mehendi & Sangeet',
   'Welcome to Bangkok! Check into hotels. Evening: Mehendi & Sangeet at Heritage Garden from 6:00 PM. Mehendi artists from 4:00 PM. Sangeet performances start 7:30 PM — rehearsal at 3:00 PM. Dinner buffet from 8:00 PM. Dress code: colorful festive wear.',
   'schedule', 'manual', 6),
  ('Schedule — Day 2 (Apr 11): Wedding & Reception',
   'Morning: Haldi at poolside, 9:00 AM (wear clothes you don''t mind getting turmeric on!). Wedding Ceremony: Riverside Pavilion at 11:00 AM — traditional Hindu ceremony, ~2 hours. Lunch: 1:30 PM. Rest: 3:00-6:00 PM. Reception & Cocktail: Grand Ballroom from 7:00 PM. DJ & dancing until late! Dress code: black tie / cocktail glam.',
   'schedule', 'manual', 7),
  ('Schedule — Day 3 (Apr 12): Farewell Brunch',
   'Farewell brunch at The Siam terrace 10:00 AM - 1:00 PM. Casual dress. Share photos and recover! Airport transfers at 8:00 AM (morning flights) and 2:00 PM (afternoon flights). Reserve your ride on the Transportation page.',
   'schedule', 'manual', 8),
  ('Food & Dietary',
   'All meals feature Indian and Thai cuisine. Vegetarian, vegan, Jain, and halal options at every meal. Mention allergies/dietary needs in your RSVP or message us. Sangeet dinner: lavish buffet. Reception: sit-down 5-course meal. Farewell brunch: casual spread.',
   'food', 'manual', 9),
  ('Gifts & Registry',
   'Your presence is the best gift! Registry on the wedding website. Couple saving for a house — monetary gifts via UPI/bank transfer welcome. No boxed gifts please — tricky with international travel! Details on the Registry page.',
   'general', 'manual', 10),
  ('Activities & Sightseeing',
   'For early arrivals or extra days: Grand Palace, Wat Pho (reclining Buddha), Chatuchak Weekend Market, Chao Phraya dinner cruise. Hotel concierge arranges private tours. Shopping: Siam Paragon, MBK Center, Asiatique. Spa: traditional Thai massage at the hotel.',
   'activities', 'manual', 11),
  ('Emergency Contacts',
   'Wedding Coordinator (Phera): 24/7 via this chat! Bride''s mom: Mrs. Sunita Sharma, +91-98765-11111. Groom''s dad: Mr. Vijay Patel, +91-98765-22222. Hotel: +66-2-206-6999. Thailand emergency: 191 (police), 1669 (ambulance), 1155 (tourist police).',
   'emergency', 'manual', 12)
) AS kb(title, content, category, source, order_index)
WHERE w.slug = 'demo-template'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 5. WHATSAPP CHAT HISTORY (concierge conversations)
-- ============================================================
INSERT INTO whatsapp_chat_history (wedding_id, guest_id, role, content)
SELECT w.id, g.id, c.role, c.content
FROM weddings w
JOIN (VALUES
  ('Priya Sharma', 'user',      'Hi! Quick question — do we need a visa for Thailand from India?'),
  ('Priya Sharma', 'assistant', 'Hey Priya! Indian passport holders get Visa on Arrival (VOA) at Bangkok airport. Valid 15 days, costs ~2,000 THB (~₹4,700). Bring: passport (6+ months valid), passport photo, proof of accommodation, return ticket. Queue usually 20-30 mins!'),
  ('Priya Sharma', 'user',      'Perfect! And what should we wear for the sangeet?'),
  ('Priya Sharma', 'assistant', 'For the Mehendi & Sangeet on Day 1, dress code is colorful Indian festive wear! Bright lehengas, anarkalis, kurtas, or fun fusion outfits. The more color the better!'),
  ('Rohan Kapoor', 'user',      'Hey, I land at BKK at 1:15 PM on Apr 10. Is there a shuttle?'),
  ('Rohan Kapoor', 'assistant', 'Hi Rohan! Yes — Airport Shuttle B departs Suvarnabhumi at 2:00 PM to The Siam Hotel. Perfect for your 1:15 PM landing! Reserve your spot on the Transportation page.'),
  ('Rohan Kapoor', 'user',      'Booked it. Also, any recs for things to do on Day 3 after brunch?'),
  ('Rohan Kapoor', 'assistant', 'After brunch, explore Bangkok! Top picks: Grand Palace & Wat Pho, Chatuchak Market (if weekend), Chao Phraya dinner cruise, or a Thai massage at the hotel spa. Hotel concierge can arrange private tours too!'),
  ('Kavya Iyer',   'user',      'Hi! My husband is Jain — will there be Jain food options?'),
  ('Kavya Iyer',   'assistant', 'Absolutely — Jain food (no onion, no garlic, no root vegetables) available at every meal. Please mention "Jain" in your RSVP dietary restrictions so caterers have an exact count!'),
  ('Kavya Iyer',   'user',      'Done! Also mentioned it in the RSVP. Thanks so much!'),
  ('Kavya Iyer',   'assistant', 'Perfect, I can see it in the system! You''re all set. Message here anytime if you need anything else. See you in Bangkok!'),
  ('Karan Malhotra','user',     'What hotels do you recommend near the venue? Nice but not too expensive.'),
  ('Karan Malhotra','assistant','Great question! Options near The Siam: 1) The Siam Hotel (venue) — ₹18,000/night, code PRIYAARJUN for 15% off. 2) Mandarin Oriental — ₹15,000/night, 10 min away. 3) Riva Surya — ₹7,000/night, budget-friendly riverside! I''d recommend Riva Surya for great value.'),
  ('Karan Malhotra','user',     'Riva Surya sounds good! Can you send the link?'),
  ('Karan Malhotra','assistant','Book at rivasuryabangkok.com or Booking.com. Mention "Priya-Arjun Wedding" for group rate. If you have trouble, let me know and I''ll connect you with the coordinator!'),
  ('Diya Nair',    'user',      'We are coming 2 days early! What should we do in Bangkok?'),
  ('Diya Nair',    'assistant', 'How exciting! Day 1: Grand Palace + Wat Pho morning, lunch at Thip Samai (famous pad thai!), Jim Thompson House afternoon, Yaowarat (Chinatown) street food evening. Day 2: Chatuchak Market morning, spa afternoon, sunset rooftop at Vertigo (Banyan Tree Hotel). Hotel concierge can arrange canal boat tours too!'),
  ('Vivek Agarwal','user',      'I''m lactose intolerant — will there be dairy-free options?'),
  ('Vivek Agarwal','assistant', 'Absolutely! Dairy-free options at every meal. Thai cuisine is naturally dairy-free, and Indian dishes will have clearly marked dairy-free alternatives. I can see "Lactose intolerant" in your RSVP — caterers will have this flagged. You''re all set!')
) AS c(guest_name, role, content) ON true
JOIN guests g ON g.wedding_id = 'demo-template' AND g.name = c.guest_name
WHERE w.slug = 'demo-template'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 6. TRAVEL SECTIONS
-- ============================================================
INSERT INTO travel_sections (wedding_id, type, title, subtitle, content, icon, order_index, more_details, address, source, visible)
SELECT w.id, ts.type, ts.title, ts.subtitle, ts.content, ts.icon, ts.order_index, ts.more_details, ts.address, 'manual', true
FROM weddings w,
(VALUES
  ('flight', 'Flight Information', 'Getting to Bangkok from India',
   'Most guests fly into Suvarnabhumi Airport (BKK). Direct flights from Delhi and Mumbai (~4 hours). Budget airlines fly to Don Mueang (DMK). Book early!',
   'flight', 0,
   'Recommended: Thai Airways (premium), IndiGo & AirAsia (budget). Delhi-Bangkok ~4 hrs, Mumbai-Bangkok ~4.5 hrs. Visa on Arrival 15 days, ~2000 THB. Bring: passport photos, hotel booking, return ticket.',
   NULL),
  ('accommodation', 'The Siam Hotel', 'Wedding Venue — Riverside Luxury',
   'Official wedding venue. Beautiful riverside on the Chao Phraya. Use code PRIYAARJUN for 15% off.',
   'hotel', 1,
   'From ₹18,000/night with discount. Includes breakfast, pool, complimentary boat shuttle. Book at thesiamhotel.com or +66-2-206-6999.',
   '3/2 Thanon Khao, Vachirapayabal, Dusit, Bangkok 10300'),
  ('accommodation', 'Mandarin Oriental Bangkok', '10 min from venue — Legendary luxury',
   'One of Asia''s most iconic hotels. Stunning river views, world-class spa.',
   'hotel', 2,
   'From ₹15,000/night. 10 min by car, 15 min by river boat from venue. Shuttle transfers arranged for events.',
   '48 Oriental Ave, Bang Rak, Bangkok 10500'),
  ('accommodation', 'Riva Surya Bangkok', 'Budget-friendly riverside option',
   'Modern boutique hotel on the Chao Phraya. Rooftop pool, river views, great value.',
   'hotel', 3,
   'From ₹7,000/night. 15 min from venue. Mention "Priya-Arjun Wedding" for group rate.',
   '23 Phra Athit Rd, Chana Songkhram, Phra Nakhon, Bangkok 10200'),
  ('travel', 'Getting Around Bangkok', 'Transportation tips',
   'Grab (ride-hailing app) is the easiest way around. BTS Skytrain covers major tourist areas. Tuk-tuks are fun — agree on price first.',
   'directions_car', 4,
   'Grab works with Indian cards. BTS ฿16-59/trip. Tuk-tuks ฿100-200 short trips. River boats ฿15-50. Get Rabbit card for BTS if staying 3+ days.',
   NULL),
  ('travel_note', 'Thailand Visa on Arrival', 'What Indian passport holders need',
   'Indian citizens get Visa on Arrival! Valid 15 days, ~2,000 THB (~₹4,700). Queue at BKK takes 20-30 min.',
   'article', 5,
   'Required: passport 6+ months valid, passport photo, hotel booking, return ticket, 10,000 THB proof of funds. VOA counter after immigration — follow signs.',
   NULL),
  ('travel_note', 'Weather & Packing Tips', 'April in Bangkok',
   'Hot and humid (32-36°C). Pack light, breathable fabrics. Sunscreen, hat, light rain jacket for showers.',
   'wb_sunny', 6,
   'Essentials: cotton/linen clothes, comfy shoes, SPF 50+, sunglasses, umbrella, power adapter (Type A/B/C — same as India!), mosquito repellent. Hotel has laundry service.',
   NULL)
) AS ts(type, title, subtitle, content, icon, order_index, more_details, address)
WHERE w.slug = 'demo-template'
ON CONFLICT DO NOTHING;


-- ============================================================
-- VERIFY
-- ============================================================
SELECT 'guests' AS tbl, COUNT(*) AS cnt FROM guests WHERE wedding_id = 'demo-template'
UNION ALL SELECT 'rsvps', COUNT(*) FROM rsvps WHERE wedding_id = 'demo-template'
UNION ALL SELECT 'transport_vehicles', COUNT(*) FROM transportation_vehicles WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'demo-template')
UNION ALL SELECT 'transport_pickups', COUNT(*) FROM transportation_pickup_locations WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'demo-template')
UNION ALL SELECT 'transport_reservations', COUNT(*) FROM transportation_reservations WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'demo-template')
UNION ALL SELECT 'transport_vehicle_types', COUNT(*) FROM transportation_vehicle_types WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'demo-template')
UNION ALL SELECT 'concierge_kb', COUNT(*) FROM concierge_knowledge_base WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'demo-template')
UNION ALL SELECT 'whatsapp_chat', COUNT(*) FROM whatsapp_chat_history WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'demo-template')
UNION ALL SELECT 'travel_sections', COUNT(*) FROM travel_sections WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'demo-template')
ORDER BY tbl;
