//
//  RNSharedWidget.m
//  Kelec
//
//  Created by Kelyan Pegeot-Selme on 18/03/2024.
//

#import <Foundation/Foundation.h>
#import "RNSharedWidget.h"
#import "Kelec-Swift.h"

@implementation RNSharedWidget

NSUserDefaults *sharedDefaults;
NSString *appGroup = @"group.kelyanselme.MyRenaultPlus";

-(dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE(RNSharedWidget)


// set crypted data
RCT_EXPORT_METHOD(setCryptedData: (NSString *)key
                  : (NSString *)data
                  resolver:(RCTPromiseResolveBlock) resolve
                  rejecter:(RCTPromiseRejectBlock) reject) {
  
  
  NSDictionary *searchQuery = @{
      (__bridge id)kSecClass:           (__bridge id)kSecClassGenericPassword,
      (__bridge id)kSecAttrAccount:     key,
      (__bridge id)kSecAttrAccessGroup: appGroup,
    };
  
  // on supprime des éléments qui seraient déjà là
  SecItemDelete((__bridge CFDictionaryRef)searchQuery);
  
  // query d'ajout
  NSDictionary *insertQuery = @{
      (__bridge id)kSecClass:           (__bridge id)kSecClassGenericPassword,
      (__bridge id)kSecAttrAccount:     key,
      (__bridge id)kSecAttrAccessGroup: appGroup,
      (__bridge id)kSecAttrAccessible:  (__bridge id)kSecAttrAccessibleAfterFirstUnlock,
      (__bridge id)kSecValueData:       [data dataUsingEncoding:NSUTF8StringEncoding],
    };
  
  OSStatus status = SecItemAdd((__bridge CFDictionaryRef)insertQuery, NULL);

  if (status == errSecSuccess) {
    resolve(nil);
  } else {
    reject(@"keychain_error",
       [NSString stringWithFormat:@"Failed to save data. Error: %d", (int)status],
       nil);
  }
}

// get crypted data
RCT_EXPORT_METHOD(getCryptedData: (NSString *)key resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *appGroup = @"group.kelyanselme.MyRenaultPlus";
  
  NSDictionary *query = @{
    (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
    (__bridge id)kSecAttrAccount: key,
    (__bridge id)kSecAttrAccessGroup: appGroup, // Add App Group
    (__bridge id)kSecReturnData: @YES, // Return the data
    (__bridge id)kSecMatchLimit: (__bridge id)kSecMatchLimitOne // Limit to one result
  };
  
  CFTypeRef result = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);
  
  if (status == errSecSuccess) {
    // Convert the result to an NSString
    NSData *data = (__bridge_transfer NSData *)result;
    NSString *cryptedData = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    resolve(cryptedData); // Resolve with the retrieved data
  } else {
    reject(@"keychain_error",
           [NSString stringWithFormat:@"Failed to retrieve data from Keychain. Error: %d", (int)status],
           nil);
  }
}

// clear crypted data
RCT_EXPORT_METHOD(clearCryptedData:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

  NSDictionary *searchQuery = @{
    (__bridge id)kSecClass:           (__bridge id)kSecClassGenericPassword,
    (__bridge id)kSecAttrAccount:     key,
    (__bridge id)kSecAttrAccessGroup: appGroup,
  };

  OSStatus status = SecItemDelete((__bridge CFDictionaryRef)searchQuery);

  if (status == errSecSuccess || status == errSecItemNotFound) {
    resolve(nil);
  } else {
    reject(@"keychain_error",
           [NSString stringWithFormat:@"Failed to delete data from Keychain. Error: %d", (int)status],
           nil);
  }
}

RCT_EXPORT_METHOD(async_getData:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // Validate input
  if (key == nil || [key length] == 0) {
    reject(@"invalid_key", @"Key cannot be nil or empty", nil);
    return;
  }
  
  NSUserDefaults *sharedDefaults = [[NSUserDefaults alloc] initWithSuiteName:appGroup];
  
  if (sharedDefaults == nil) {
    reject(@"usergroup_error", @"unable to open shared groups", nil);
    return;
  }
  
  id rawData = [sharedDefaults objectForKey:key];
  if (![rawData isKindOfClass:[NSData class]]) {
    reject(@"data_error", @"stored data is not NSData", nil);
    return;
  }
  
  NSData *data = (NSData *)rawData;
  NSString *dataString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  
  if (dataString == nil) {
    reject(@"data_error", @"unable to decode data as UTF-8", nil);
    return;
  }
  
  resolve(dataString);
}

RCT_EXPORT_METHOD(setData: (NSString *)key: (NSString * )data: (RCTResponseSenderBlock)callback) {
  
  sharedDefaults = [[NSUserDefaults  alloc]initWithSuiteName:appGroup];
  
  if(sharedDefaults == nil) {
    callback(@[@0]);
    return;
  }
  
  [sharedDefaults setValue:data forKey:key];
  if (@available(iOS 14, *)) {
    [WidgetKitHelper reloadAllTimelines];
  } else {
    // Fallback on earlier versions
  }
  callback(@[[NSNull null]]);
}

RCT_EXPORT_METHOD(getData: (NSString *)key: (RCTResponseSenderBlock)callback){
  sharedDefaults = [[NSUserDefaults  alloc]initWithSuiteName:appGroup];
  
  if(sharedDefaults == nil) {
    callback(@[[NSNull null]]);
    return;
  }
  
  NSData *data = [sharedDefaults objectForKey:key];
  NSString *dataString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  
  if(dataString == nil) {
    callback(@[[NSNull null]]);
    return;
  }
  
  callback(@[dataString]);
}

RCT_EXPORT_METHOD(getAllKeys: (RCTResponseSenderBlock)callback){
  sharedDefaults = [[NSUserDefaults  alloc]initWithSuiteName:appGroup];
  
  if(sharedDefaults == nil) {
    callback(@[@0]);
    return;
  }
  
  NSArray *keys = [sharedDefaults dictionaryRepresentation].allKeys;
  if(keys == nil) {
    callback(@[@0]);
    return;
  }
  
  callback(@[keys]);
}

RCT_EXPORT_METHOD(refreshWidgets: (RCTResponseSenderBlock)callback){
  if (@available(iOS 14, *)) {
    [WidgetKitHelper reloadAllTimelines];
  } else {
    // Fallback on earlier versions
  }
  callback(@[[NSNull null]]);
}



@end
