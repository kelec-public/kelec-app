package com.kelec.oidc

import com.kelec.BuildConfig

object OidcConfig {
    const val ENDPOINT_TOKEN: String = BuildConfig.OIDC_ENDPOINT_TOKEN;
    const val REDIRECT_URI: String = BuildConfig.OIDC_REDIRECT_URI;
    const val CLIENT_ID: String = BuildConfig.OIDC_CLIENT_ID;
}