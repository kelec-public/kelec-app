//
//  RNSharedWidget.m
//  Kelec
//
//  Created by Kelyan Pegeot-Selme on 18/03/2024.
//

#import <Foundation/Foundation.h>
#import "RNSharedWidget.h"
#import "Kelec-Swift.h"
#include <sys/file.h>

@implementation RNSharedWidget

NSUserDefaults *sharedDefaults;
static NSString *const appGroup = @"group.kelyanselme.MyRenaultPlus";

// File lock cross-process partagé via App Group container
static int acquireTokenRefreshLock(void) {
    NSURL *groupURL = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:appGroup];
    if (!groupURL) return -1;
    NSURL *lockURL = [groupURL URLByAppendingPathComponent:@"token_refresh.lock"];
    if (![[NSFileManager defaultManager] fileExistsAtPath:lockURL.path]) {
        [[NSFileManager defaultManager] createFileAtPath:lockURL.path contents:nil attributes:nil];
    }
    int fd = open(lockURL.path.UTF8String, O_RDWR);
    if (fd != -1) flock(fd, LOCK_EX);
    return fd;
}

static void releaseTokenRefreshLock(int fd) {
    if (fd != -1) { flock(fd, LOCK_UN); close(fd); }
}

-(dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE(RNSharedWidget)



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

// to store sensitive data such as password
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

RCT_EXPORT_METHOD(getValidToken:(NSString *)email
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    // 1. Lire les tokens depuis le Keychain
    NSString *keychainKey = [NSString stringWithFormat:@"%@_tokens", email];
    NSDictionary *query = @{
      (__bridge id)kSecClass:           (__bridge id)kSecClassGenericPassword,
      (__bridge id)kSecAttrAccount:     keychainKey,
      (__bridge id)kSecAttrAccessGroup: appGroup,
      (__bridge id)kSecReturnData:      @YES,
      (__bridge id)kSecMatchLimit:      (__bridge id)kSecMatchLimitOne
    };

    CFTypeRef result = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);
    if (status != errSecSuccess) {
      reject(@"no_token", @"No tokens found in Keychain", nil);
      return;
    }

    NSData *tokenData = (__bridge_transfer NSData *)result;
    NSString *tokensJson = [[NSString alloc] initWithData:tokenData encoding:NSUTF8StringEncoding];
    NSMutableDictionary *tokens = [[NSJSONSerialization JSONObjectWithData:tokenData options:NSJSONReadingMutableContainers error:nil] mutableCopy];
    if (!tokens) {
      reject(@"parse_error", @"Failed to parse tokens from Keychain", nil);
      return;
    }

    // 2. Vérifier l'expiration du access_token (décodage JWT)
    NSString *accessToken = tokens[@"access_token"];
    BOOL needsRefresh = YES;
    NSArray *parts = [accessToken componentsSeparatedByString:@"."];
    if (parts.count >= 2) {
      NSString *payload = parts[1];
      NSUInteger pad = (4 - payload.length % 4) % 4;
      payload = [payload stringByAppendingString:[@"===" substringToIndex:pad]];
      payload = [payload stringByReplacingOccurrencesOfString:@"-" withString:@"+"];
      payload = [payload stringByReplacingOccurrencesOfString:@"_" withString:@"/"];
      NSData *payloadData = [[NSData alloc] initWithBase64EncodedString:payload options:0];
      if (payloadData) {
        NSDictionary *claims = [NSJSONSerialization JSONObjectWithData:payloadData options:0 error:nil];
        NSNumber *exp = claims[@"exp"];
        if (exp) {
          long long now = (long long)[[NSDate date] timeIntervalSince1970];
          needsRefresh = exp.longLongValue < now + 30;
        }
      }
    }
    
    if (!needsRefresh) {
      resolve(tokensJson);
      return;
    }

    // 3. Acquérir le file lock cross-process avant de refresh
    int lockFd = acquireTokenRefreshLock();

    // Double-check : un autre process a peut-être déjà rafraîchi pendant qu'on attendait
    CFTypeRef freshResult = NULL;
    OSStatus freshStatus = SecItemCopyMatching((__bridge CFDictionaryRef)query, &freshResult);
    if (freshStatus == errSecSuccess) {
      NSData *freshData = (__bridge_transfer NSData *)freshResult;
      NSString *freshJson = [[NSString alloc] initWithData:freshData encoding:NSUTF8StringEncoding];
      NSMutableDictionary *freshTokens = [[NSJSONSerialization JSONObjectWithData:freshData options:NSJSONReadingMutableContainers error:nil] mutableCopy];
      if (freshTokens) {
        NSString *freshAccess = freshTokens[@"access_token"];
        BOOL stillExpired = YES;
        NSArray *freshParts = [freshAccess componentsSeparatedByString:@"."];
        if (freshParts.count >= 2) {
          NSString *p = freshParts[1];
          NSUInteger pad2 = (4 - p.length % 4) % 4;
          p = [p stringByAppendingString:[@"===" substringToIndex:pad2]];
          p = [p stringByReplacingOccurrencesOfString:@"-" withString:@"+"];
          p = [p stringByReplacingOccurrencesOfString:@"_" withString:@"/"];
          NSData *pData = [[NSData alloc] initWithBase64EncodedString:p options:0];
          if (pData) {
            NSDictionary *claims = [NSJSONSerialization JSONObjectWithData:pData options:0 error:nil];
            NSNumber *exp = claims[@"exp"];
            if (exp) {
              long long now = (long long)[[NSDate date] timeIntervalSince1970];
              stillExpired = exp.longLongValue < now + 30;
            }
          }
        }
        if (!stillExpired) {
          releaseTokenRefreshLock(lockFd);
          resolve(freshJson);
          return;
        }
        tokens = freshTokens;
      }
    }

    // 4. Refresh
    NSString *refreshToken = tokens[@"refresh_token"];
    NSString *savedEmail   = tokens[@"email"];
    NSString *personId     = tokens[@"personId"];

    NSString *tokenEndpoint = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"OIDC_ENDPOINT_TOKEN"];
    NSString *clientId      = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"OIDC_CLIENT_ID"];
    NSString *redirectUri   = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"OIDC_REDIRECT_URI"];

    NSString *encodedRefresh  = [refreshToken stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLQueryAllowedCharacterSet]];
    NSString *encodedRedirect = [redirectUri  stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLQueryAllowedCharacterSet]];
    NSString *body = [NSString stringWithFormat:
      @"grant_type=refresh_token&refresh_token=%@&client_id=%@&redirect_uri=%@&scope=openid%%20email%%20personId%%20lang%%20renaultGroupFull",
      encodedRefresh, clientId, encodedRedirect];

    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:tokenEndpoint]];
    [request setHTTPMethod:@"POST"];
    [request setValue:@"application/x-www-form-urlencoded" forHTTPHeaderField:@"Content-Type"];
    [request setHTTPBody:[body dataUsingEncoding:NSUTF8StringEncoding]];

    [[[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
      if (error) { releaseTokenRefreshLock(lockFd); reject(@"refresh_error", error.localizedDescription, error); return; }

      NSHTTPURLResponse *http = (NSHTTPURLResponse *)response;
      if (http.statusCode != 200) {
        NSString *msg = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        releaseTokenRefreshLock(lockFd);
        reject(@"refresh_failed", [NSString stringWithFormat:@"HTTP %ld: %@", (long)http.statusCode, msg], nil);
        return;
      }

      NSMutableDictionary *newTokens = [[NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:nil] mutableCopy];
      if (!newTokens) { releaseTokenRefreshLock(lockFd); reject(@"parse_error", @"Failed to parse refresh response", nil); return; }

      // Préserver email et personId (non retournés par le endpoint refresh)
      if (savedEmail) newTokens[@"email"]    = savedEmail;
      if (personId)   newTokens[@"personId"] = personId;

      NSData *newData = [NSJSONSerialization dataWithJSONObject:newTokens options:0 error:nil];
      NSString *newJson = [[NSString alloc] initWithData:newData encoding:NSUTF8StringEncoding];

      // Sauvegarder dans le Keychain
      NSDictionary *deleteQuery = @{
        (__bridge id)kSecClass:           (__bridge id)kSecClassGenericPassword,
        (__bridge id)kSecAttrAccount:     keychainKey,
        (__bridge id)kSecAttrAccessGroup: appGroup,
      };
      SecItemDelete((__bridge CFDictionaryRef)deleteQuery);
      NSDictionary *insertQuery = @{
        (__bridge id)kSecClass:           (__bridge id)kSecClassGenericPassword,
        (__bridge id)kSecAttrAccount:     keychainKey,
        (__bridge id)kSecAttrAccessGroup: appGroup,
        (__bridge id)kSecAttrAccessible:  (__bridge id)kSecAttrAccessibleAfterFirstUnlock,
        (__bridge id)kSecValueData:       [newJson dataUsingEncoding:NSUTF8StringEncoding],
      };
      SecItemAdd((__bridge CFDictionaryRef)insertQuery, NULL);
      releaseTokenRefreshLock(lockFd);

      resolve(newJson);
    }] resume];
  });
}



@end
