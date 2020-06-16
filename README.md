# TileBD09Layer
mapbox叠加百度底图

```
var map = new mapboxgl.Map({
	  container: 'map',
	  center:  [107.51335144042969, 26.27496910095215],
	  zoom: 12,
	  fadeDuration:0,
	  style: {
		"version":8,
		"name":"Positron",
		"metadata":{},
		//"sprite":"http://10.0.3.96:8085/styles/positron/sprite",
		//"glyphs":"http://10.0.3.96:8085/fonts/{fontstack}/{range}.pbf",
		//local
		//"glyphs":"/static/fonts/{fontstack}/{range}.pbf",
		//service
		"glyphs":"fonts/{fontstack}/{range}.pbf",
		"sources":{},
		"layers":[]
	},
	hash: false,
	  
	});
	map.on('load', function() {
		
		var tileLayer = new TileBD09Layer({
			url:"http://online1.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=2&color_dep=32&colors=50&udt=20180426"
			//url:"http://maponline0.bdimg.com/tile/?qt=vtile&x={x}&y={y}&z={z}&styles=pl&scaler=1&udt=20200611&from=jsapi2_0"
		});

		tileLayer.addTo(map);

	});
  ```
