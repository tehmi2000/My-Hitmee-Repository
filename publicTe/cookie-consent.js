document.addEventListener('DOMContentLoaded', function(){
    cookieconsent.run({
        "notice_banner_type":"interstitial",
        "consent_type":"express",
       "palette":"light",
       "change_preferences_selector":"#changePreferences",
       "language":"en",
       "website_name":"hitmee",
       "change_settings_element":"#changeCookPref" 
    });
});