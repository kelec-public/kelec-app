//
//  MapView.swift
//  KelecWatchOs Watch App
//
//  Created by Kelyan PEGEOT SELME on 03/02/2025.
//

import SwiftUI
import _MapKit_SwiftUI
import ClockKit
import CoreLocation

struct Pin: Identifiable{
  let id = UUID()
  let coordinate: CLLocationCoordinate2D
}


struct MapView: View {
  @State var userCar: UserCar
  
  @State var carName: String = "test"
  
  @State var mapLongitude: Double = 0
  @State var mapLatitude: Double = 0

  
  var body: some View {
    if(mapLatitude == 0 && mapLongitude == 0){
      // not yet loaded map data
      ProgressView()
        .task {
          await fetchCarLocation(carAccount: userCar)
        }
    }else if (mapLatitude == -1.0 && mapLongitude == -1.0){
      // there have been an error
      Text("Impossible to get car location")
    }else{
      // successfully fetched data
      ZStack{
        Map(
          coordinateRegion: getMapCoordinates(),
          annotationItems: [getPinCoordinates()]
        ){
          MapMarker(coordinate: $0.coordinate)
        }
        
//        VStack{
//          Spacer()
//          Button{
//            let coordinate = CLLocationCoordinate2D(latitude: Double(latitude) ?? 0, longitude: Double(longitude) ?? 0)
//            let location = CLKLaunchableLocation(locationName: carName, location: coordinate)
//            WKExtension.shared().openSystemURL(location.url)
//          }label: {
//            Text("Marcher vers \(carName)")
//            
//            
//          }.background(Color("orange"))
//            .cornerRadius(25)
//            .padding(.bottom, 20)
//          
//        }
        
      }
    }


    
  }
  
  
  func fetchCarLocation(carAccount: UserCar) async{
    let vin = carAccount.car?.vin ?? "VIN"
    let client = getCarMakerApiClient(usercar: carAccount)
    
    do{
      let fetchedApiLocation = try await client.getMapCoordinates(vin: vin, jwt: "")
      zeServices.saveLoadedLocation(vin: vin, latitude: fetchedApiLocation.0, longitude: fetchedApiLocation.1)
      self.mapLatitude = fetchedApiLocation.0
      self.mapLongitude = fetchedApiLocation.1
    }catch{
      // try to load from local saved
//      if let savedLocation = zeServices.loadSavedLocations(vin: vin){
//        self.mapLatitude = savedLocation.latitude
//        self.mapLongitude = savedLocation.longitude
//      }else{
        self.mapLatitude = -1.0
        self.mapLongitude = -1.0
//      }
      // an error occured
    }
  
  }
  
  func getMapCoordinates() -> Binding<MKCoordinateRegion> {
    return Binding<MKCoordinateRegion>(
                get: {
                    MKCoordinateRegion(
                        center: CLLocationCoordinate2D(latitude: self.mapLatitude, longitude: self.mapLongitude),
                        span: MKCoordinateSpan(latitudeDelta: 0.00222, longitudeDelta:  0.00222)
                    )
                },
                set: { newRegion in
                    
                }
            )
  }
  
  func getPinCoordinates() -> Pin{
    
    let location = CLLocationCoordinate2D(latitude: self.mapLatitude, longitude: self.mapLongitude)
    return Pin(coordinate: location)
  }
  
}

//#Preview {
//  let parisLatitude = 48.854700
//  let parisLongitude = 2.347749
//  MapView(
//    carName: "IONIQ",
//    mapLongitude: parisLongitude,
//    mapLatitude: parisLatitude
//  )
//    .edgesIgnoringSafeArea(.all)
//}
