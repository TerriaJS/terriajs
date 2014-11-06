#!/bin/bash
#
# Our entry point for the varnish proxy and cache docker container.
# I'm trying to leave the varnish config that's checked into our nm
# repo identical wheather it's running inside a docker container or
# not, so I'm applying some last minute config changes to varnish
# when the container boots up allowing us to have a dynamically
# assigned address and port for our backend container.

function abort() {
	echo $1
	exit $2
}

[ -z "$NM_PORT_3001_TCP_ADDR" ] && abort "Nationalmap backend address is not defined" 1
[ -z "$NM_PORT_3001_TCP_PORT" ] && abort "Nationalmap backend port is not defined"

sed -e "s/127.0.0.1/$NM_PORT_3001_TCP_ADDR/g" -e "s/3001/$NM_PORT_3001_TCP_PORT/g" < /default.vcl > /etc/varnish/default.vcl


# The following are the important slivers from the varnish upstart script
# shipped with the varnish deb package in ubuntu 14.04.

# Include varnish defaults if available
if [ -f /etc/default/varnish ] ; then
    . /etc/default/varnish
fi

# Open files (usually 1024, which is way too small for varnish)
ulimit -n ${NFILES:-131072}

# Maxiumum locked memory size for shared memory log
ulimit -l ${MEMLOCK:-82000}


/usr/sbin/varnishd ${DAEMON_OPTS}

# Haven't found a way to prevent varnish from detatching
# FIXME :P
while true
do
	sleep 36000
done