from setuptools import setup, find_packages

version = '0.1'

setup(
	name='ckanext-cesiumpreview',
	version=version,
	description='A plugin to CKAN to use AusGlobe as a previewer for data.gov.au',
	long_description='',
	classifiers=[], # Get strings from http://pypi.python.org/pypi?%3Aaction=list_classifiers
	keywords='',
	author='NICTA',
	author_email='',
	url='',
	license='',
	packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
	namespace_packages=['ckanext', 'ckanext.cesiumpreview'],
	include_package_data=True,
	zip_safe=False,
	install_requires=[],
	entry_points=\
	"""
        [ckan.plugins]
	cesium_viewer=ckanext.cesiumpreview.plugin:CesiumPreview
	""",
)
