# A docker image running varnish proxy and cache
# configuration for a nationalmap production
# deployment
FROM ubuntu:14.04
MAINTAINER briely.marum@nicta.com.au
RUN apt-get update && apt-get install -y varnish
VOLUME ["/mnt/cache/varnish"]
EXPOSE 80
ADD default.vcl /default.vcl
ADD varnish /etc/default/varnish
ADD boot_varnish.sh /boot_varnish.sh
RUN chmod +x /boot_varnish.sh
CMD ["/boot_varnish.sh"]