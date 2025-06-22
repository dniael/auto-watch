export interface AddTheftType {
  contact: {
    name: string
    phone: string
    context: string
  }
  info: {
    brand: string
    color: string
    date: Date
    licensePlate: string
    model: string
    plateProvince: string
    type: string
    year: number
    photo: string
  }
  location: {
    address: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }
}

export interface AddSightingType {
  contact: {
    name: string
    phone: string
    context: string
  }
  info: {
    photo: string
    licensePlate: string
  }
  location: {
    address: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }
}