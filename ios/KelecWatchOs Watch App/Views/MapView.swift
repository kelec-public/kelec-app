//
//  MapView.swift
//  KelecWatchOs Watch App
//
//  Created by Kelyan PEGEOT SELME on 03/02/2025.
//

import SwiftUI
import MapKit
import CoreLocation

struct Pin: Identifiable{
  let id = UUID()
  let coordinate: CLLocationCoordinate2D
}

private enum CarLocationState {
  case loading
  case failed
  case loaded(CLLocationCoordinate2D)
}

struct MapView: View {
  let userCar: UserCar
  @State private var state: CarLocationState = .loading

  var body: some View {
    switch state {
    case .loading:
      ProgressView()
        .task {
          await fetchCarLocation()
        }
    case .failed:
      Text("watchCarLocationError")
    case .loaded(let coordinate):
      if #available(watchOS 10, *) {
        Map(initialPosition: .region(region(around: coordinate))) {
          Marker(userCar.car?.model ?? "", coordinate: coordinate)
        }
      } else {
        // watchOS 9: the watch app still supports it
        Map(
          coordinateRegion: .constant(region(around: coordinate)),
          annotationItems: [Pin(coordinate: coordinate)]
        ){
          MapMarker(coordinate: $0.coordinate)
        }
      }
    }
  }

  private func region(around coordinate: CLLocationCoordinate2D) -> MKCoordinateRegion {
    MKCoordinateRegion(
      center: coordinate,
      span: MKCoordinateSpan(latitudeDelta: 0.00222, longitudeDelta: 0.00222)
    )
  }

  func fetchCarLocation() async{
    let vin = userCar.car?.vin ?? "VIN"
    do{
      let (latitude, longitude) = try await getCarMakerApiClient(usercar: userCar).getMapCoordinates(vin: vin)
      VehicleCache.saveLocation(vin: vin, latitude: latitude, longitude: longitude)
      state = .loaded(CLLocationCoordinate2D(latitude: latitude, longitude: longitude))
    }catch{
      state = .failed
    }
  }
}
