import logging

import ckan.plugins as p

from ckan.common import json

log = logging.getLogger(__name__)

try:
    import os
    import ckanext.resourceproxy.plugin as proxy
except ImportError:
    pass

class CesiumPreview(p.SingletonPlugin):
    '''This extension adds Cesium. '''
    p.implements(p.IConfigurer, inherit=True)
    p.implements(p.IConfigurable, inherit=True)
    if p.toolkit.check_ckan_version('2.3'):
        p.implements(p.IResourceView, inherit=True)
    else:
    	p.implements(p.IResourcePreview, inherit=True)

    Cesium_Formats = ['wms','wfs','kml', 'kmz','gjson', 'geojson', 'czml']
    proxy_is_enabled = False

    def update_config(self, config):
        p.toolkit.add_public_directory(config, 'theme/public')
        p.toolkit.add_template_directory(config, 'theme/templates')
        p.toolkit.add_resource('theme/public', 'ckanext-cesiumpreview')

    def configure(self, config):
        enabled = config.get('ckan.resource_proxy_enabled', False)
        self.proxy_is_enabled = enabled

    def can_preview(self, data_dict):
        resource = data_dict['resource']
        format_lower = resource['format'].lower()
        if (format_lower == ''):
            format_lower = os.path.splitext(resource['url'])[1][1:].lower()
#        print format_lower
        if format_lower in self.Cesium_Formats:
            if resource.get('on_same_domain') or self.proxy_is_enabled:
                return {'can_preview': True, 'quality': 2}
            else:
                return {'can_preview': True,
                        'fixable': 'Enable resource_proxy',
                        'quality': 2}
        return {'can_preview': False}

    def info(self): return {'name': 'cesium_view', 'title': 'National Map Beta', 'always_available': True, 'default_title': 'National Map Beta', 'icon': 'globe' }

    def can_view(self, data_dict):
        resource = data_dict['resource']
        format_lower = resource['format'].lower()
        if (format_lower == ''):
            format_lower = os.path.splitext(resource['url'])[1][1:].lower()
#        print format_lower
        if format_lower in self.Cesium_Formats:
	    return True
        return False

#    def setup_template_variables(self, context, data_dict):
#        if (self.proxy_is_enabled
#                and not data_dict['resource']['on_same_domain']):
#            url = proxy.get_proxified_resource_url(data_dict)
#            p.toolkit.c.resource['url'] = url

    def preview_template(self, context, data_dict):
        return 'cesium.html'
    def view_template(self, context, data_dict):
        return 'cesium.html'
