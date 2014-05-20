#!/bin/bash

sudo /etc/init.d/varnish stop
sudo cp default.vcl /etc/varnish/default.vcl
sudo cp varnish /etc/default/varnish
sudo cp vmods/*.so /usr/lib/x86_64-linux-gnu/varnish/vmods/
#sudo cp vmods/*.so /usr/lib/varnish/vmods/
sudo /etc/init.d/varnish start

