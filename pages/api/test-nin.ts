import type { NextApiRequest, NextApiResponse } from 'next'

// Test data with unique NINs
const testData = {
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
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { nin } = req.body
    console.log('Test API received NIN:', nin)

    if (!nin) {
      return res.status(400).json({ error: 'NIN is required' })
    }

    // Check if NIN exists in our test database
    const citizenData = testData[nin as keyof typeof testData]
    console.log('Found test citizen data:', citizenData)

    if (!citizenData) {
      console.log('NIN not found in test database')
      return res.status(404).json({ error: 'NIN not found' })
    }

    // Return the citizen data
    console.log('Returning test citizen data for NIN:', nin)
    return res.status(200).json(citizenData)
  } catch (error) {
    console.error('Test NIN verification error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 