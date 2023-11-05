import lamejs from './lame.min.js'
const {Mp3Encoder} = lamejs;

const notes=[];

const ctx = new AudioContext();

function addCompressor(ctx) {

	(ctx.limiter = new DynamicsCompressorNode(ctx, {
		ratio: 17,
		knee:8,
		threshold: -16,
		//attack: 0,
		release: .1,
	}))
	.connect(new GainNode(ctx, {gain: 1.65}))
	.connect(ctx.destination);
}
addCompressor(ctx);

function playBuffer(note, time, context=ctx) {

	if (context==ctx && ctx.state != "running") {
		ctx.resume().then(()=>playBuffer(note, time));
		return;
	}
    const {buffer, i} = note;
    const source = new AudioBufferSourceNode(context, {buffer});
    //console.log(i)
    const gain = new GainNode(context, {gain: i==6?.25:.35});
    //gain.connect(context.destination);

   if ('i' in note) source.connect(gain).connect(context.limiter);
   else source.connect(context.destination)

    if (note.source?.context == context) {
    	const {gain} = note.gain;
    	const t = (context.currentTime || time) + .03;
    	if (time) gain.setValueAtTime(gain.value, time)
    	gain.linearRampToValueAtTime(0, t);
    	note.source.stop(t)
    }

    Object.assign(note, {source, gain})

    source.start(time);
    $(source).on('ended', e=>{
    	source.disconnect()
    	gain.disconnect()

    	if (note.source == source) delete note.source;
    	//console.log(source)
    })
}

async function saveRecord(track){

	const silence = .1, bitRate =  48000,
	 last = track.at(-1).split(':'),
	 duration = last[1] / 1000 + notes[last[0]].buffer.duration +silence;

	const offlineCtx = new OfflineAudioContext(2, bitRate * duration, bitRate);
	addCompressor(offlineCtx);

	track.forEach(item => {
		const [note, time] = item.split(':')
		console.log(time);
		playBuffer(notes[note], time / 1000 + silence, offlineCtx)
	})

	offlineCtx.startRendering().then((buffer) => {
		console.log(buffer);
		playBuffer({buffer})
		// audioEncoder(buf, 128, function (e) {
		// 	progress(e)
		// }, function onComplete(blob) {
		// 	progress(0)
		// 	fileSaver.saveAs(blob, 'pantan.mp3')
		// })
	})
}

export {ctx, playBuffer, saveRecord, notes}

window.saveRecord = saveRecord;
