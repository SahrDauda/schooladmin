import type { NextApiRequest, NextApiResponse } from 'next'

// 30 Sierra Leonean citizens with realistic data
const citizensData = {
  'SL12345678': {
    firstName: "Fatmata",
    lastName: "Kamara",
    dateOfBirth: "2008-05-12",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "23 Main Street, Freetown",
    phoneNumber: "+232-76-123456",
    emailaddress: "fatmata.kamara@gmail.com"
  },
  'SL87654321': {
    firstName: "Mohamed",
    lastName: "Sesay",
    dateOfBirth: "2012-08-20",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "15 Circular Road, Freetown",
    phoneNumber: "+232-76-654321",
    emailaddress: "mohamed.sesay@gmail.com"
  },
  'SL11223344': {
    firstName: "Aminata",
    lastName: "Bangura",
    dateOfBirth: "2006-11-03",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "7 Lumley Road, Freetown",
    phoneNumber: "+232-76-112233",
    emailaddress: "aminata.bangura@gmail.com"
  },
  'SL55667788': {
    firstName: "Ibrahim",
    lastName: "Koroma",
    dateOfBirth: "2009-03-15",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "45 Circular Road, Freetown",
    phoneNumber: "+232-76-456789",
    emailaddress: "ibrahim.koroma@gmail.com"
  },
  'SL99887766': {
    firstName: "Mariama",
    lastName: "Turay",
    dateOfBirth: "2007-07-22",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "12 Aberdeen Road, Freetown",
    phoneNumber: "+232-76-998877",
    emailaddress: "mariama.turay@gmail.com"
  },
  'SL33445566': {
    firstName: "Alhaji",
    lastName: "Mansaray",
    dateOfBirth: "2005-12-08",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "8 Regent Road, Freetown",
    phoneNumber: "+232-76-334455",
    emailaddress: "alhaji.mansaray@gmail.com"
  },
  'SL77889900': {
    firstName: "Hawa",
    lastName: "Conteh",
    dateOfBirth: "2010-04-18",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "33 Pademba Road, Freetown",
    phoneNumber: "+232-76-778899",
    emailaddress: "hawa.conteh@gmail.com"
  },
  'SL22334455': {
    firstName: "Sorie",
    lastName: "Kargbo",
    dateOfBirth: "2004-09-25",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "19 Kissy Road, Freetown",
    phoneNumber: "+232-76-223344",
    emailaddress: "sorie.kargbo@gmail.com"
  },
  'SL66778899': {
    firstName: "Fatou",
    lastName: "Sankoh",
    dateOfBirth: "2011-01-14",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "27 Wellington Street, Freetown",
    phoneNumber: "+232-76-667788",
    emailaddress: "fatou.sankoh@gmail.com"
  },
  'SL44556677': {
    firstName: "Lamin",
    lastName: "Kamara",
    dateOfBirth: "2003-06-30",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "14 Fourah Bay Road, Freetown",
    phoneNumber: "+232-76-445566",
    emailaddress: "lamin.kamara@gmail.com"
  },
  'SL88990011': {
    firstName: "Aissatou",
    lastName: "Bangura",
    dateOfBirth: "2008-11-05",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "6 Gloucester Street, Freetown",
    phoneNumber: "+232-76-889900",
    emailaddress: "aissatou.bangura@gmail.com"
  },
  'SL11112222': {
    firstName: "Mohamed",
    lastName: "Turay",
    dateOfBirth: "2006-02-17",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "31 Murray Town Road, Freetown",
    phoneNumber: "+232-76-111122",
    emailaddress: "mohamed.turay@gmail.com"
  },
  'SL22223333': {
    firstName: "Mariama",
    lastName: "Sesay",
    dateOfBirth: "2009-08-12",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "22 Congo Cross, Freetown",
    phoneNumber: "+232-76-222233",
    emailaddress: "mariama.sesay@gmail.com"
  },
  'SL33334444': {
    firstName: "Ibrahim",
    lastName: "Conteh",
    dateOfBirth: "2005-03-28",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "9 Charlotte Street, Freetown",
    phoneNumber: "+232-76-333344",
    emailaddress: "ibrahim.conteh@gmail.com"
  },
  'SL44445555': {
    firstName: "Hawa",
    lastName: "Koroma",
    dateOfBirth: "2007-10-15",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "17 Siaka Stevens Street, Freetown",
    phoneNumber: "+232-76-444455",
    emailaddress: "hawa.koroma@gmail.com"
  },
  'SL55556666': {
    firstName: "Sorie",
    lastName: "Sankoh",
    dateOfBirth: "2010-12-03",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "25 Campbell Street, Freetown",
    phoneNumber: "+232-76-555566",
    emailaddress: "sorie.sankoh@gmail.com"
  },
  'SL66667777': {
    firstName: "Fatou",
    lastName: "Mansaray",
    dateOfBirth: "2004-05-20",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "11 Kroo Town Road, Freetown",
    phoneNumber: "+232-76-666677",
    emailaddress: "fatou.mansaray@gmail.com"
  },
  'SL77778888': {
    firstName: "Lamin",
    lastName: "Bangura",
    dateOfBirth: "2008-07-09",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "3 Cline Town Road, Freetown",
    phoneNumber: "+232-76-777788",
    emailaddress: "lamin.bangura@gmail.com"
  },
  'SL88889999': {
    firstName: "Aissatou",
    lastName: "Kamara",
    dateOfBirth: "2006-01-31",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "28 King Street, Freetown",
    phoneNumber: "+232-76-888899",
    emailaddress: "aissatou.kamara@gmail.com"
  },
  'SL99990000': {
    firstName: "Mohamed",
    lastName: "Turay",
    dateOfBirth: "2009-04-25",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "16 Sanders Street, Freetown",
    phoneNumber: "+232-76-999900",
    emailaddress: "mohamed.turay2@gmail.com"
  },
  'SL00001111': {
    firstName: "Mariama",
    lastName: "Sesay",
    dateOfBirth: "2005-09-18",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "7 Berry Street, Freetown",
    phoneNumber: "+232-76-000011",
    emailaddress: "mariama.sesay2@gmail.com"
  },
  'SL11110000': {
    firstName: "Ibrahim",
    lastName: "Conteh",
    dateOfBirth: "2007-12-07",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "13 Rawdon Street, Freetown",
    phoneNumber: "+232-76-111100",
    emailaddress: "ibrahim.conteh2@gmail.com"
  },
  'SL22220000': {
    firstName: "Hawa",
    lastName: "Koroma",
    dateOfBirth: "2010-06-14",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "21 Percival Street, Freetown",
    phoneNumber: "+232-76-222200",
    emailaddress: "hawa.koroma2@gmail.com"
  },
  'SL33330000': {
    firstName: "Sorie",
    lastName: "Sankoh",
    dateOfBirth: "2004-11-29",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "5 Howe Street, Freetown",
    phoneNumber: "+232-76-333300",
    emailaddress: "sorie.sankoh2@gmail.com"
  },
  'SL44440000': {
    firstName: "Fatou",
    lastName: "Mansaray",
    dateOfBirth: "2008-02-11",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "29 Garrison Street, Freetown",
    phoneNumber: "+232-76-444400",
    emailaddress: "fatou.mansaray2@gmail.com"
  },
  'SL55550000': {
    firstName: "Lamin",
    lastName: "Bangura",
    dateOfBirth: "2006-08-04",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "10 Lightfoot Boston Street, Freetown",
    phoneNumber: "+232-76-555500",
    emailaddress: "lamin.bangura2@gmail.com"
  },
  'SL66660000': {
    firstName: "Aissatou",
    lastName: "Kamara",
    dateOfBirth: "2009-01-23",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "24 East Street, Freetown",
    phoneNumber: "+232-76-666600",
    emailaddress: "aissatou.kamara2@gmail.com"
  },
  'SL77770000': {
    firstName: "Mohamed",
    lastName: "Turay",
    dateOfBirth: "2005-10-16",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "18 West Street, Freetown",
    phoneNumber: "+232-76-777700",
    emailaddress: "mohamed.turay3@gmail.com"
  },
  'SL88880000': {
    firstName: "Mariama",
    lastName: "Sesay",
    dateOfBirth: "2007-04-02",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "32 East Street, Freetown",
    phoneNumber: "+232-76-888800",
    emailaddress: "mariama.sesay3@gmail.com"
  },
  'SL99990001': {
    firstName: "Ibrahim",
    lastName: "Conteh",
    dateOfBirth: "2010-07-19",
    gender: "Male",
    nationality: "Sierra Leonean",
    address: "26 West Street, Freetown",
    phoneNumber: "+232-76-999901",
    emailaddress: "ibrahim.conteh3@gmail.com"
  },
  'SL00000001': {
    firstName: "Hawa",
    lastName: "Koroma",
    dateOfBirth: "2004-12-08",
    gender: "Female",
    nationality: "Sierra Leonean",
    address: "30 East Street, Freetown",
    phoneNumber: "+232-76-000001",
    emailaddress: "hawa.koroma3@gmail.com"
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { nin } = req.body
    console.log('API received NIN:', nin)

    if (!nin) {
      return res.status(400).json({ error: 'NIN is required' })
    }

    // Check if NIN exists in our database
    const citizenData = citizensData[nin as keyof typeof citizensData]
    console.log('Found citizen data:', citizenData)

    if (!citizenData) {
      console.log('NIN not found in database')
      return res.status(404).json({ error: 'NIN not found' })
    }

    // Return the citizen data
    console.log('Returning citizen data for NIN:', nin)
    return res.status(200).json(citizenData)
  } catch (error) {
    console.error('NIN verification error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 