# Setting up GeoServer

Geoserver will allow you to host your own spatial data on the web, such as vector data (e.g. shapefiles) and rasters. Geoserver can serve vector data and rasters as [WMS](https://www.ogc.org/standards/wms), and vector data as [WFS](https://www.ogc.org/standards/wfs). These can then be added as catalog items to your TerriaMap and viewed from anywhere.

Here we describe the process of setting up Geoserver on a server running Ubuntu OS (e.g. see below for how to setup on an AWS virtual machine).

## Installing Java and Tomcat8

On ubuntu install the java and tomcat8 packages

```
sudo add-apt-repository ppa:webupd8team/java
sudo apt-get update
sudo apt-get install -y oracle-java8-installer
sudo apt-get install -y oracle-java8-set-default
```

Check that you have the correct java version installed. It should be 1.8.\_xx.

```
java -version
```

Now install Tomcat

```
sudo apt-get install tomcat8
```

To check that the server is running properly, open your browser and go to http://localhost:8080.

### Tuning up the Tomcat server

Edit the tomcat8 settings file

```
sudo nano /etc/default/tomcat8
```

Make the following changes to JAVA_OPTS and JAVA_HOME

```
JAVA_OPTS="-Djava.awt.headless=true -server -Xmx8384m -Xms2048m -XX:SoftRefLRUPolicyMSPerMB=36000 -XX:MaxPermSize=2048m -XX:+UseParallelGC"

JAVA_HOME=/usr/lib/jvm/java-8-oracle/jre
```

And restart your tomcat server

```
sudo /etc/init.d/tomcat8 restart
```

## Installing Geoserver

To install geoserver, go to the [GeoServer website](http://geoserver.org/) and download the current stable web archive file to your home folder, unzip the file and copy geoserver.war to your home folder, and then copy that file to the tomcat installation as the desired name for the geoserver and restart. For example to create a geoserver called my_new_geoserver use the commands below.

```
sudo cp geoserver.war /var/lib/tomcat8/webapps/my_new_geoserver.war
sudo /etc/init.d/tomcat8 restart
```

You should now be able to see a geoserver running at http://localhost:8080/my_new_geoserver/ .

The geoserver will contain the example datasets that ship with Geoserver. Geoserver has good documentation available [here](http://docs.geoserver.org/stable/en/user/) to get you going on entering your data into your server instance.

## Caching Tiles

In order for your server to perform effectively we highly recommend that you cache the tile requests from TerriaMap. There are 2 primary ways to do this - either turning on the GeoWebCache that comes with Geoserver or running a proxy server in front of your geoserver.

The easiest solution is to just use the GeoWebCache service. The documentation for GeoWebCache is [here](http://docs.geoserver.org/stable/en/user/geowebcache/). Mainly it consists of turning on direct integration in the caching defaults and making sure that your layers have caching turned on. You may also want to control the caching folder which can be done by editing your geoserver instance as explained [here](http://docs.geoserver.org/2.1.4/user/geowebcache/config.html). You will also probably need to set permissions in your new cache folder to 666.

The other solution is to put a caching proxy in front of your geoserver instance. This also has the benefit of being able to access your server on port 80 if you wish. The option we recommend is [nginx](http://nginx.org/en/). This is FOSS software and is available as a package on ubuntu. Below is an example of setting up nginx to work with geoserver.

### nginx

```
sudo apt-get install -y nginx
```

Then modify the configuration files to point to your server and turn on caching

```
sudo /etc/init.d/nginx stop
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.orig
sudo nano /etc/nginx/nginx.conf
```

and add this line at the bottom of the http section

```
proxy_cache_path /your/cache/folder/ keys_zone=one:10m max_size=8G;
```

```
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.orig
sudo nano /etc/nginx/sites-available/default
```

in the servers section, comment out the root and index lines and add this line right after

```
proxy_cache one;
```

and replace the location setting in the server section with the following code (replacing my_new_geoserver with your server name)

```
	location /my_new_geoserver/ {
 		proxy_pass http://127.0.0.1:8080/;
		proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
       		proxy_redirect off;
        	proxy_buffering off;
        	proxy_set_header        Host            $http_host;
        	proxy_set_header        X-Real-IP       $remote_addr;
        	proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
	}
```

Now restart

```
sudo /etc/init.d/nginx start
```

And if all went as planned you should be able to access your server at http://localhost/my_new_geoserver/web.

## Allowing TerriaMap to access your server

Due to security in modern browsers, for TerriaMap to use your service you will probably need to do a little more work. Either you will need to set up your server with CORS support or provide a proxy service for your geoserver to allow TerriaMap access to your data. TerriaMap includes a proxy to some domains by default and if you are in these domains we will provide the proxy service.

If you are not in these domains, you will get an cross-domain-access error. To work with TerriaMap without using a proxy, Geoserver must be configured to support [CORS](http://enable-cors.org/). The most common way to do this is to install [CORS Filter](http://software.dzhuvinov.com/cors-filter-installation.html).

An alternative approach, is to add CORS support to your nginx proxy service. See the documentation on how to do this.

## Moving your Geoserver Instance

Moving your geoserver instance to a new location is pretty straightforward. The .war file that a geoserver instance comes in is just a special layout of a .zip file. So the following commands can be used to create a .war file that you can then add to a tomcat instance on another server.

```
sudo /etc/init.d/tomcat8 stop
sudo mv /var/lib/tomcat8/webapps/my_new_geoserver .
cd my_new_geoserver
zip -r my_new_geoserver.war *
sudo mv my_new_geoserver /var/lib/tomcat8/webapps
sudo /etc/init.d/tomcat8 start
```

once it's uploaded to the new site you can add the geoserver with:

```
sudo cp my_new_geoserver.war /var/lib/tomcat8/webapps/my_new_geoserver.war
sudo /etc/init.d/tomcat8 restart
```

## Running your Geoserver on AWS

Running a geoserver on a standard EC2 instance requires a little tuning to take advantage of the instance storage volume properly. First go ahead and create your instance (we use a standard m3.large instance with port 80 opened) and install java and tomcat as explained above.

Now package up your geoserver as described in the previous section and copy it up to your EC2 instance and ssh in once it's copied.

```
scp -i geoserver-instance.pem my_new_geoserver.war ubuntu@xx.xx.xx.xx:/home/ubuntu
ssh -i geoserver-instance.pem ubuntu@xx.xx.xx.xx
```

From the shell the first thing you need to do is move the webapps folder in tomcat to the instance storage.

```
sudo /etc/init.d/tomcat8 stop
sudo cp -rf /var/lib/tomcat8/webapps /var/lib/tomcat8/webapps.orig
sudo mv /var/lib/tomcat8/webapps/ /mnt
sudo ln -s /mnt/webapps /var/lib/tomcat8/webapps
```

and copy your uploaded geoserver

```
sudo cp *.war /mnt/webapps
```

and then restart

```
sudo /etc/init.d/tomcat8 start
sudo /etc/init.d/nginx restart
```

If you are using geowebcache or a caching proxy you will need to change the caching dir as referenced above to also be on the /mnt drive to avoid running out of space on the EC2 boot drive.

NOTE: If the instance is stopped you will need to go through these step again when you start, since the instance storage is wiped clean in this case. This does not apply to reboot of the OS in the EC2 instance so it will still be fine after.
