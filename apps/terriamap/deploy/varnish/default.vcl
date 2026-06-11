vcl 4.0;

backend default {
    .host = "127.0.0.1";
    .port = "3001";
}

sub vcl_recv {
  if (req.method == "GET" && req.url ~ "^/proxy"){
    return (hash);
  }
}

sub vcl_backend_response {
  if (beresp.status >= 400) {
    set beresp.ttl = 0s;
  }

  if (bereq.url ~ "https?://stat\.data\.abs\.gov\.au/sdmx-json") {
    // Remove the cookie so that the response can be cached.
    unset beresp.http.Set-Cookie;

    // The ABS SDMX-JSON API has a habit of returning HTML
    // responses with a 200 OK code on error.  Detect this and
    // don't cache it.
    if (beresp.status == 200 && beresp.http.Content-Type ~ "text/html") {
      set beresp.ttl = 0s;
    }
  }
}
