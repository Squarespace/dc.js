dc.schema = function() {

    var CARDINALITY_THRESHOLD_TO_PRESERVE_VALUES = 20;

    var DATE_FORMATS = [
	d3.time.format.iso,
	d3.time.format("%Y-%m-%d %H:%M:%S"),
	d3.time.format("%Y-%m-%d"),
	d3.time.format("%m-%d-%Y %H:%M:%S"),
	d3.time.format("%m-%d-%Y"),
	d3.time.format("%m-%d-%Y %H:%M:%S"),
	d3.time.format("%m/%d/%Y"),
	d3.time.format("%m/%d/%Y %H:%M:%S")
    ];

    var parsePossibleDate = function(v) {
        // short-circuit on number: if in expected range for epoch seconds or millis,
        // interpret it that way.
        for ( var i = 0; i < DATE_FORMATS.length; i++ ) {
          // iso format parses many bare ints as strange dates. skip iso format
          // if value too short.
          if ( i == 0 && v.length < 12 ) {
            continue;
          }
          var val = DATE_FORMATS[i].parse(v);
          if ( val != null ) { return val; }
        }
        return null;
    };


    var _date_granularities = {
      'day': 1,
      'hour': 2,
      'minute': 3,
      'second': 4
    };

    var setDateGranularity = function(fmd, d) {
      if ( ! fmd.date_granularity ) {
        fmd.date_granularity = 'day';
      }
      if ( d == null ) {
        return;
      }
      if ( _date_granularities[ fmd.date_granularity ] < 4 && d.getSeconds() != 0 ) {
        fmd.date_granularity = 'second';
      }
      else if ( _date_granularities[ fmd.date_granularity ] < 3 && d.getMinutes() != 0 ) {
        fmd.date_granularity = 'minute';
      }
      else if ( _date_granularities[ fmd.date_granularity ] < 2 && d.getHours() != 0 ) {
        fmd.date_granularity = 'hour';
      }
    };

    var schema = {};

    schema.coerceData = function(data, metadata) {
        // find all properies whose type is 'date'.
      var dateprops = {};
      for ( var name in metadata.properties ) {
        if ( metadata.properties[name].type == "date" ) {
	        dateprops[name] = metadata.properties[name];
          var md = metadata.properties[name]; 
          if ( md.minimum != null ) { 
            md.minimum = parsePossibleDate(md.minimum);
          }
          if ( md.maximum != null ) {
            md.maximum = parsePossibleDate(md.maximum);
          }
        }
      }
    if ( ! dateprops ) { return; }
    for ( var i=0; i < data.length; i++ ) {
	    var d = data[i];
	    for ( var k in d ) {
	      if (  dateprops[k] ) {
          d[k] = parsePossibleDate(d[k]);
          setDateGranularity(dateprops[k], d[k]);
        }
	    }
      }
    };

    var newFieldMetadata = function() { return { "required": true, "cardinality": 0 }; };

    var determineDataType = function(v, currentType, coerce) {
	var thisType = null;
	var v_typeof = typeof(v);
	var coercedValue = v;
	var wasCoerced = false;
  var valueIsNullish = ( v == null || v == "" );
  if ( valueIsNullish ) {
    // do nothing.
  }
  else if( Object.prototype.toString.call( v ) === '[object Array]' ) {
	    thisType = 'array';
	}
  else if ( v_typeof == "string" ) {
	    var pdate = parsePossibleDate(v);
	    if ( pdate != null ) {
		thisType = "date";
		if ( coerce ) {
		    coercedValue = pdate;
		    wasCoerced = true;
		}
	    }
	    else 
	        thisType = "string";
	}
	else if ( v_typeof == "number" ) 
	    thisType = "number";
	else if ( v_typeof == "integer" ) 
	    thisType = "integer";
	else if ( v_typeof == "boolean" ) 
	    thisType = "boolean";
	else if ( v.getMonth === "function" )
	    thisType = "date";
	
	if ( currentType != null && thisType != currentType ) {
      if ( valueIsNullish && currentType == "date" ) {
          thisType = "date";
          coercedValue = null;
          wasCoerced = true;
      }
      else if ( valueIsNullish ) 
          thisType = currentType;
      else if ( thisType == "number" && currentType == "integer" ) 
	        thisType = "number";
      else if ( thisType == "integer" && currentType == "number" ) 
	        thisType = "number";
      else if ( thisType == "date" && currentType == "string" ) 
	        thisType = "string";
	    else 
	        thisType = "mixed";
	}
	return  { 'type' : thisType, 'coercedValue' : coercedValue, 'wasCoerced' : wasCoerced };
    };

    var objectSize = function(obj) {
        var size = 0;
	for ( var k in obj ) {
	    if ( obj.hasOwnProperty(k) ) size++;
	}
	return size;
    };

    schema.getMetadata = function(data, coerce) {
        var metadata = {};
	var props = {};
	metadata['properties'] = props;

	for ( var i = 0; i < data.length; i++ ) {
	    var item = data[i];
	    for ( var k in item ) {
	        var val = item[k];
		var fmd = props[k];
		if ( fmd == null ) {
		    fmd = newFieldMetadata();
		    props[k] = fmd;
		}
		if ( val == null ) {
		    fmd.required = false;
		}
		else {
		    var currentType = fmd.type;
		    var thisType = determineDataType(val, currentType, coerce);
		    if ( currentType == null )
		        fmd.type = thisType.type;
        else if ( thisType.type != currentType ) 
		        fmd.type = "mixed";
		    if ( thisType.wasCoerced ) {
			val = thisType.coercedValue;
			item[k] = val;
		    }
		}

		var uniqs = fmd.values;
		if ( uniqs == null ) {
		    uniqs = {};
		    fmd.values = uniqs;
		}
		// val coerced to string for key, but kept intact for value.
		if ( uniqs[val] === undefined )  {
		    fmd.cardinality++;
		    uniqs[ val ] = { value: val, count: 0 };
    }
    uniqs[val].count++;

		// max and min. for date, do a granularity check too.
    if ( fmd.type == 'date' ) {
      setDateGranularity(fmd, val);
      if ( fmd.minimum == null || fmd.minimum == "" || (val != null && val < fmd.minimum) )  {
          console.log(fmd.minimum, val);
          fmd.minimum = val;
      }
      if ( fmd.maximum == null || fmd.maximum == "" || (val != null && val > fmd.maximum) ) 
          fmd.maximum = val;
    }
    else {
      if ( fmd.minimum === undefined || val < fmd.minimum ) 
          fmd.minimum = val;
      if ( fmd.maximum === undefined || val > fmd.maximum ) 
          fmd.maximum = val;
    }
	}
  }

	for ( var fname in props ) {
	    var fmd = props[fname];
	    if ( fmd.cardinality >  CARDINALITY_THRESHOLD_TO_PRESERVE_VALUES ) {
		    delete fmd.values;
	    }
      else {
        var lfv, mfv;
        for ( var k in fmd.values ) {
          var val = fmd.values[k].count;
          if ( val == null ) continue;
          if ( lfv == undefined || val < lfv ) 
            lfv = val;
          if ( mfv == undefined || val > mfv ) 
            mfv = val;
        }
        fmd.least_value_frequency = lfv;
        fmd.greatest_value_frequency = mfv;
      }
	}

	return metadata;
    };

    return schema;
}();
