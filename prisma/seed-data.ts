// prisma/seed-data.ts

export const SERVICES = [
  { name: 'Engine Oil Change', category: 'FLUIDS', price: 600 },
  { name: 'Oil Filter Replacement', category: 'FILTERS', price: 250 },
  { name: 'Fuel Filter Replacement', category: 'FILTERS', price: 400 },
  { name: 'Air Filter Replacement', category: 'FILTERS', price: 300 },
  { name: 'Pollen (Cabin) Filter', category: 'FILTERS', price: 350 },
  { name: 'Spark Plugs Replacement', category: 'IGNITION', price: 1200 },
  { name: 'Coolant Fluid Change', category: 'FLUIDS', price: 450 },
  { name: 'Gearbox Oil Change', category: 'FLUIDS', price: 1500 },
  { name: 'Drive Belt Replacement', category: 'ENGINE', price: 2200 },
  { name: 'Timing Belt Replacement', category: 'ENGINE', price: 3500 },
  { name: 'Power Steering Oil Change', category: 'FLUIDS', price: 500 },
  { name: 'Brake Fluid Change', category: 'FLUIDS', price: 600 }, // NEW
];

const S = {
  Oil: 'Engine Oil Change',
  OilFilter: 'Oil Filter Replacement',
  Fuel: 'Fuel Filter Replacement',
  Air: 'Air Filter Replacement',
  Pollen: 'Pollen (Cabin) Filter',
  Plugs: 'Spark Plugs Replacement',
  Coolant: 'Coolant Fluid Change',
  Gearbox: 'Gearbox Oil Change',
  DriveBelt: 'Drive Belt Replacement',
  TimingBelt: 'Timing Belt Replacement',
  Steering: 'Power Steering Oil Change',
  BrakeFluid: 'Brake Fluid Change', // Helper alias
};

// Data Structure: Brand -> Model -> { engine, rules: { km: [ServiceList] } }
export const CAR_DATA: any = {
  Opel: {
    'Grandland X': { engine: '1.6 Turbo', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Fuel, S.Air, S.Pollen], 30000: [S.Plugs], 40000: [S.Coolant], 60000: [S.Gearbox], 90000: [S.DriveBelt]
    }},
    'Astra J': { engine: '1.6L', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Fuel, S.Air, S.Pollen], 40000: [S.Coolant], 60000: [S.Plugs, S.Gearbox, S.DriveBelt, S.TimingBelt]
    }},
  },
  Kia: {
    'Cerato K3': { engine: '1.6 MPI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.Fuel, S.Plugs, S.Coolant, S.DriveBelt], 60000: [S.Gearbox]
    }},
    'Sportage GDI': { engine: '1.6 GDI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air], 40000: [S.Fuel, S.Pollen, S.Coolant], 60000: [S.Plugs, S.DriveBelt, S.Gearbox]
    }},
    'Sportage NQ5': { engine: '1.6 Turbo GDI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air], 40000: [S.Fuel, S.Pollen, S.Coolant], 60000: [S.Plugs, S.DriveBelt], 100000: [S.Gearbox]
    }},
    'Picanto': { engine: '1.2 MPI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.Fuel, S.Plugs, S.DriveBelt, S.Coolant, S.Gearbox]
    }},
    'Rio': { engine: '1.4 MPI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.Fuel, S.Plugs, S.DriveBelt, S.Coolant, S.Gearbox]
    }},
  },
  Hyundai: {
    'Elantra AD': { engine: '1.6 MPI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen, S.Plugs], 40000: [S.Fuel, S.Coolant], 60000: [S.DriveBelt, S.Gearbox]
    }},
    'Tucson GDI': { engine: '1.6 GDI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air], 40000: [S.Fuel, S.Pollen, S.Coolant], 60000: [S.Plugs, S.DriveBelt, S.Gearbox]
    }},
    'Tucson NX4': { engine: '1.6 Turbo GDI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air], 40000: [S.Fuel, S.Pollen, S.Coolant], 60000: [S.Plugs, S.DriveBelt], 100000: [S.Gearbox]
    }},
    'Elantra HD': { engine: '1.6 Gamma', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen, S.Plugs], 40000: [S.Fuel, S.Coolant, S.Gearbox], 60000: [S.DriveBelt]
    }},
    'IX35': { engine: '1.6 GDI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen, S.Plugs], 40000: [S.Fuel, S.Coolant], 60000: [S.DriveBelt, S.Gearbox]
    }},
    'Elantra CN7': { engine: '1.6 MPI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen, S.Plugs], 40000: [S.Fuel, S.Coolant], 60000: [S.DriveBelt, S.Gearbox]
    }},
    'i10': { engine: '1.2 Kappa', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen, S.Plugs], 40000: [S.Fuel, S.Coolant, S.Gearbox], 60000: [S.DriveBelt]
    }},
  },
  MG: {
    'MG 5': { engine: '1.5L', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.Fuel], 60000: [S.Plugs, S.Gearbox], 80000: [S.Coolant], 100000: [S.DriveBelt]
    }},
    'MG 6': { engine: '1.5 Turbo', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.Fuel, S.Plugs], 60000: [S.Gearbox], 80000: [S.Coolant], 100000: [S.DriveBelt]
    }},
    'MG HS': { engine: '1.5 Turbo GDI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.Fuel, S.Plugs], 60000: [S.Gearbox], 80000: [S.Coolant], 100000: [S.DriveBelt]
    }},
    'MG RX5': { engine: '1.5 Turbo', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.Fuel, S.Plugs], 60000: [S.Gearbox], 80000: [S.Coolant], 100000: [S.DriveBelt]
    }},
  },
  Skoda: {
    'Octavia A7': { engine: '1.6 MPI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 60000: [S.Fuel, S.Plugs, S.DriveBelt, S.TimingBelt, S.Coolant, S.Gearbox]
    }},
    'Octavia A8': { engine: '1.4 TSI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Pollen], 30000: [S.Air, S.Plugs], 50000: [S.DriveBelt, S.Gearbox], 60000: [S.Fuel, S.Coolant], 100000: [S.TimingBelt]
    }},
    'Kodiaq': { engine: '1.4 TSI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Pollen], 30000: [S.Air, S.Plugs], 50000: [S.Gearbox], 60000: [S.Fuel, S.Coolant], 100000: [S.DriveBelt, S.TimingBelt]
    }},
  },
  Nissan: {
    'Sunny N17': { engine: '1.5L', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 30000: [S.Fuel], 40000: [S.Plugs, S.DriveBelt, S.Coolant, S.Gearbox]
    }},
    'Sentra': { engine: '1.6L', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 30000: [S.Fuel], 40000: [S.Plugs, S.DriveBelt, S.Coolant, S.Gearbox]
    }},
    'Qashqai J11': { engine: '1.2 Turbo', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.Fuel, S.Plugs, S.DriveBelt, S.Coolant, S.Gearbox]
    }},
  },
  Fiat: {
    'Tipo Automatic': { engine: '1.6 E-Torq', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen, S.Fuel], 40000: [S.Plugs], 50000: [S.DriveBelt], 60000: [S.Gearbox], 80000: [S.Coolant]
    }},
    'Tipo Manual': { engine: '1.4 Fire', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen, S.Fuel], 40000: [S.Plugs], 60000: [S.DriveBelt, S.TimingBelt], 80000: [S.Coolant], 100000: [S.Gearbox]
    }},
    '500x': { engine: '1.4 MultiAir', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen, S.Fuel], 30000: [S.Plugs], 60000: [S.DriveBelt, S.TimingBelt, S.Gearbox], 80000: [S.Coolant]
    }},
  },
  Jeep: {
    'Renegade': { engine: '1.4 MultiAir', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen, S.Fuel], 30000: [S.Plugs], 60000: [S.DriveBelt, S.TimingBelt, S.Gearbox], 80000: [S.Coolant]
    }},
  },
  Seat: {
    'Ibiza': { engine: '1.6 MPI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.DriveBelt], 50000: [S.Gearbox], 60000: [S.Fuel, S.Plugs, S.TimingBelt, S.Coolant]
    }},
  },
  Mitsubishi: {
    'Lancer EX': { engine: '1.6 MIVEC', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air], 40000: [S.Fuel, S.Pollen, S.Plugs, S.DriveBelt, S.Coolant, S.Gearbox]
    }},
    'Eclipse Cross': { engine: '1.5L Turbo', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air], 40000: [S.Pollen, S.DriveBelt, S.Gearbox], 50000: [S.Fuel, S.Coolant], 80000: [S.Plugs]
    }},
  },
  Citroen: {
    'C-Elysée': { engine: '1.6 VTi', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen, S.Plugs], 40000: [S.Coolant], 60000: [S.DriveBelt, S.TimingBelt, S.Gearbox]
    }},
    'C5 Aircross': { engine: '1.6 Turbo', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.Fuel, S.Plugs], 60000: [S.DriveBelt, S.Coolant, S.Gearbox]
    }},
    'C4 Picasso': { engine: '1.6 THP', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.Fuel, S.Plugs], 60000: [S.DriveBelt, S.Coolant, S.Gearbox]
    }},
  },
  Peugeot: {
    '301 (4-Gear)': { engine: '1.6 VTi (4AT)', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen, S.Plugs], 40000: [S.Coolant, S.Gearbox], 60000: [S.TimingBelt, S.DriveBelt]
    }},
    '301 (6-Gear)': { engine: '1.6 VTi (6AT)', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen, S.Plugs], 40000: [S.Coolant], 60000: [S.TimingBelt, S.DriveBelt, S.Gearbox]
    }},
    '3008': { engine: '1.6 THP', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air], 40000: [S.Fuel, S.Pollen, S.Plugs], 60000: [S.DriveBelt, S.Gearbox, S.Coolant]
    }},
    '5008': { engine: '1.6 THP', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air], 40000: [S.Fuel, S.Pollen, S.Plugs], 60000: [S.DriveBelt, S.Gearbox, S.Coolant]
    }},
    '508': { engine: '1.6 THP', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air], 40000: [S.Fuel, S.Pollen, S.Plugs], 60000: [S.DriveBelt, S.Gearbox, S.Coolant]
    }},
  },
  Chery: {
    'Arrizo 5 Manual': { engine: '1.5L DVVT', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Fuel, S.Air, S.Pollen], 30000: [S.Gearbox], 40000: [S.Plugs, S.DriveBelt, S.Coolant], 60000: [S.Steering]
    }},
    'Arrizo 5 CVT': { engine: '1.5L DVVT', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Fuel, S.Air, S.Pollen], 40000: [S.Plugs, S.DriveBelt, S.Coolant, S.Gearbox], 60000: [S.Steering]
    }},
    'Tiggo 3': { engine: '1.6L DVVT', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Fuel, S.Air], 40000: [S.Pollen, S.Plugs, S.DriveBelt, S.Coolant, S.Gearbox]
    }},
    'Tiggo 7': { engine: '1.5 Turbo', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Fuel, S.Air, S.Pollen], 40000: [S.Plugs, S.Coolant], 50000: [S.DriveBelt], 100000: [S.Gearbox]
    }},
  },
  Jetour: {
    'X70': { engine: '1.5T', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.Fuel, S.Plugs, S.Coolant], 60000: [S.Gearbox, S.DriveBelt]
    }},
    'X70 Plus': { engine: '1.6T GDI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.Fuel, S.Plugs, S.Coolant], 60000: [S.Gearbox, S.DriveBelt]
    }},
    'X90': { engine: '1.6T GDI', rules: {
      10000: [S.Oil, S.OilFilter], 20000: [S.Air, S.Pollen], 40000: [S.Fuel, S.Plugs, S.Coolant], 60000: [S.Gearbox, S.DriveBelt]
    }},
  },
  Toyota: {
    'Corolla (2014-2025)': { engine: '1.6L VVT-i', rules: {
      10000: [S.Oil, S.OilFilter],
      20000: [S.Air],
      40000: [S.Fuel, S.Pollen, S.Plugs, S.DriveBelt, S.Coolant, S.Gearbox]
    }},
},
Chevrolet: {
    'New Optra': { engine: '1.5L', rules: {
      10000: [S.Oil, S.OilFilter],
      20000: [S.Fuel, S.Air, S.Pollen],
      30000: [S.Plugs, S.Coolant],
      50000: [S.Gearbox],
      60000: [S.DriveBelt]
    }},
    'Captiva (New Shape)': { engine: '1.5L Turbo', rules: {
      10000: [S.Oil, S.OilFilter],
      20000: [S.Fuel, S.Air],
      30000: [S.Pollen, S.Plugs, S.Coolant],
      60000: [S.DriveBelt],
      100000: [S.Gearbox]
    }},
  
  },
  Renault: {
    'Logan AT': { engine: '1.6L MPI', rules: {
      10000: [S.Oil, S.OilFilter],
      20000: [S.Air, S.Pollen, S.Fuel, S.Plugs], // Heavy 20k service
      40000: [S.Coolant],
      60000: [S.TimingBelt, S.DriveBelt, S.Gearbox]
    }},
    'Sandero AT': { engine: '1.6L MPI', rules: {
      10000: [S.Oil, S.OilFilter],
      20000: [S.Air, S.Pollen, S.Fuel, S.Plugs],
      40000: [S.Coolant],
      60000: [S.TimingBelt, S.DriveBelt, S.Gearbox]
    }},
    'Duster AT': { engine: '1.6L MPI', rules: {
      10000: [S.Oil, S.OilFilter],
      20000: [S.Air, S.Pollen, S.Fuel, S.Plugs],
      40000: [S.Coolant],
      60000: [S.TimingBelt, S.DriveBelt, S.Gearbox]
    }},
  'Megane 4 1.6': { engine: '1.6 SCe', rules: {
      10000: [S.Oil, S.OilFilter],
      20000: [S.Air, S.Pollen],
      40000: [S.Gearbox],
      60000: [S.Plugs, S.DriveBelt, S.Coolant]
    }},
    'Megane 1.2 Turbo': { engine: '1.2 TCe', rules: {
      8000: [S.Oil, S.OilFilter],
      16000: [S.Air, S.Pollen],
      56000: [S.Plugs],
      64000: [S.DriveBelt, S.Coolant]
    }},
    'Kadjar': { engine: '1.2 TCe', rules: {
      8000: [S.Oil, S.OilFilter],
      16000: [S.Air, S.Pollen],
      56000: [S.Plugs],
      64000: [S.DriveBelt, S.Coolant]
    }},
  },
  Subaru: {
    'XV': { engine: '1.6L Boxer', rules: {
      10000: [S.Oil, S.OilFilter],
      20000: [S.Air, S.Pollen],
      40000: [S.Fuel, S.Coolant, S.Gearbox],
      60000: [S.Plugs, S.DriveBelt, S.BrakeFluid]
    }},
    'Impreza': { engine: '1.6L Boxer', rules: {
      10000: [S.Oil, S.OilFilter],
      20000: [S.Air, S.Pollen],
      40000: [S.Fuel, S.Coolant, S.Gearbox],
      60000: [S.Plugs, S.DriveBelt, S.BrakeFluid]
    }},
  },
  Mazda: {
    '3': { engine: '1.6L SkyActiv', rules: {
      10000: [S.Oil, S.OilFilter],
      20000: [S.Air],
      30000: [S.Fuel, S.Pollen, S.Plugs], // Distinct 30k cycle
      40000: [S.Gearbox],
      60000: [S.DriveBelt, S.Coolant, S.BrakeFluid]
    }},
  }

};