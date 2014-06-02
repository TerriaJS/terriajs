import urlcode;

### local apache default backend
backend apache { .host = "127.0.0.1"; 
                 .port = "3001"; 
                 .probe = { .url = "/status.php"; 
                            .interval = 5s; .timeout = 1s; 
                            .window = 5;
                            .threshold = 3; }
}

### allowed domains
backend cloak_arcgisonline {
    .host = "services.arcgisonline.com";
    .port = "80";
}
backend cloak_georef {
    .host = "spatialreference.org";
    .port = "80";
}
backend cloak_wagis {
    .host = "www2.landgate.wa.gov.au";
    .port = "80";
}
backend cloak_grofsoft {
    .host = "realtime.grofsoft.com";
    .port = "80";
}
backend cloak_geofabric {
    .host = "geofabric.bom.gov.au";
    .port = "80";
}
backend cloak_ga {
    .host = "www.ga.gov.au";
    .port = "80";
}


### single varnish server setup
director web1 round-robin {
	{.backend=apache;}
}

sub vcl_recv {
    set req.backend=web1;

    # Use anonymous, cached pages if all backends are down.
    if (!req.backend.healthy) {
        unset req.http.Cookie;
    }
 
    # Allow the backend to serve up stale content if it is responding slowly.
    set req.grace = 48h;


    set req.url = urlcode.decode(req.url);

    # masqurading 
    if (req.url ~ "^/proxy\/\?") {
        if (req.url ~ "^/proxy\/\?((http|https|ftp):\/\/services\.arcgisonline\.com)") {
            set req.url = regsub(req.url, "^/proxy\/\?((http|https|ftp):\/\/services\.arcgisonline\.com)", "/");
            set req.backend = cloak_arcgisonline;
            set req.http.host = "services.arcgisonline.com";
        } elsif  (req.url ~ "^/proxy\/\?((http|https|ftp):\/\/spatialreference\.org\/)") {
            set req.url = regsub(req.url, "^/proxy\/\?((http|https|ftp):\/\/spatialreference\.org\/)", "/");
            set req.backend = cloak_georef;
            set req.http.host = "spatialreference.org";
        } elsif  (req.url ~ "^/proxy\/\?((http|https|ftp):\/\/www2\.landgate\.wa\.gov\.au)") {
            set req.url = regsub(req.url, "^/proxy\/\?((http|https|ftp):\/\/www2\.landgate\.wa\.gov\.au\/)", "/");
            set req.backend = cloak_wagis;
            set req.http.host = "www2.landgate.wa.gov.au";
        } elsif  (req.url ~ "^/proxy\/\?((http|https|ftp):\/\/geofabric\.bom\.gov\.au)") {
            set req.url = regsub(req.url, "^/proxy\/\?((http|https|ftp):\/\/geofabric\.bom\.gov\.au\/)", "/");
            set req.backend = cloak_geofabric;
            set req.http.host = "geofabric.bom.gov.au";
        } elsif  (req.url ~ "^/proxy\/\?((http|https|ftp):\/\/www\.ga\.gov\.au)") {
            set req.url = regsub(req.url, "^/proxy\/\?((http|https|ftp):\/\/www\.ga\.gov\.au\/)", "/");
            set req.backend = cloak_ga;
            set req.http.host = "www.ga.gov.au";
        } elsif  (req.url ~ "^/proxy\/\?((http|https|ftp):\/\/realtime\.grofsoft\.com)") {
            set req.url = regsub(req.url, "^/proxy\/\?((http|https|ftp):\/\/realtime\.grofsoft\.com\/)", "/");
            set req.backend = cloak_grofsoft;
            set req.http.host = "realtime.grofsoft.com";
        } else {
            error 404 "URL not in proxy list";
        }

        #set req.http.host = "nicta.com.au";
        remove req.http.Cookie;
        #error 404 "Masquerade Testing";
        return(lookup);
    }



    # Always cache the following file types for all users.
    if (req.url ~ "(?i)\.(png|gif|jpeg|jpg|ico|swf|css|js|html|htm)(\?[a-z0-9]+)?$")
    {
        unset req.http.Cookie;
        #error 404 "Pathways testing";
    }

    if (req.request != "GET" &&
        req.request != "HEAD" &&
        req.request != "PUT" &&
        req.request != "POST" &&
        req.request != "TRACE" &&
        req.request != "OPTIONS" &&
        req.request != "DELETE") {
          /* Non-RFC2616 or CONNECT which is weird. */
          return (pipe);
      }

    # Testing - return 404 for undiserable domain /donottouch 
    if (req.url ~ "^/donottouch$" ) {
        error 404 "Page not found.";
    }

     if (req.request != "GET" && req.request != "HEAD") {
          /* We only deal with GET and HEAD by default */
          return (pass);
      }
      if (req.http.Authorization || req.http.Cookie) {
          /* Not cacheable by default */
          return (pass);
      }


      return (lookup);
}
  
  sub vcl_pipe {
     return (pipe);
  }
  
  sub vcl_pass {
    return (pass);
  }
  
  sub vcl_hash {
     hash_data(req.url);
     if (req.http.host) {
         hash_data(req.http.host);
     } else {
         hash_data(server.ip);
     }
     return (hash);
 }
 
 sub vcl_hit {
     return (deliver);
 }
 
 sub vcl_miss {
     return (fetch);
 }
 
 sub vcl_fetch {

     # Don't allow static files to set cookies.
     if (req.url ~ "(?i)\.(png|gif|jpeg|jpg|ico|swf|css|js|html|htm)(\?[a-z0-9]+)?$") {
         # beresp == Back-end response from the web server.
         unset beresp.http.set-cookie;
     }

 }
 
 sub vcl_deliver {

    # Add a header to indicate a cache HIT/MISS
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }

    return (deliver);
 }
 
 sub vcl_error {
     set obj.http.Content-Type = "text/html; charset=utf-8";
     set obj.http.Retry-After = "5";
     synthetic {"
 <?xml version="1.0" encoding="utf-8"?>
 <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
 <html>
   <head>
     <title>"} + obj.status + " " + obj.response + {"</title>
   </head>
   <body>
     <h1>Error "} + obj.status + " " + obj.response + {"</h1>
     <p>"} + obj.response + {"</p>
     <h3>VARNISH TESTING:</h3>
     <p>req.http.host: "} + req.http.host + {"</p>
     <p>req.url: "} + req.url + {"</p>
     <p>req.backend.healthy: "} + req.backend.healthy + {"</p>
     <hr>
     <p>Varnish cache server testing</p>
   </body>
 </html>
 "};
     return (deliver);
 }
 
 sub vcl_init {
 	return (ok);
 }
 
 sub vcl_fini {
 	return (ok);
 }

