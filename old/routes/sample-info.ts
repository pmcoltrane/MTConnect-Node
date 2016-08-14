/**
 * SampleInfo encapsulates all the data needed to store a single sample.
 * Sample typically includes the timestamp, sequence number, id and value,
 * along with some other info for some types of DataItem 
 */
 interface SampleInfo{
	 timestamp?:Date;
	 sequence?:number;
	 id?:string;
	 value?:string;
 }
 
 export = SampleInfo;