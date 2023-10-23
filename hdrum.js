const $=jQuery, $win = $(window);

function url(url) {
	return new URL(url, import.meta.url).href
};
//function

const container=$('#hdrum-vidget');

const notes=[], pointers = [], volume0 = .6;

function play(note) {
	const {$audio, $petal} = notes[note];

	let t0 = performance.now(), started;

	$audio.each(function(){
		const audio = this;
		if (this.classList.contains('active')) {
			this.volume-=.01;
			this.classList.remove('active');
			this._intId = setInterval(()=>{
				const t = performance.now(), dt=t-t0;
				t0=t;
				let {volume} = audio;

				volume-=dt*.008
				if (volume<=0) {
					audio.pause()
					audio.currentTime = 0;
					clearInterval(audio._intId)
				} else {
					audio.volume = volume
				}

			})
		} else if (!started) {
			audio.currentTime=0;
			clearInterval(audio._intId);
			audio.volume = volume0;
			audio.classList.add('active');
			audio.play();
			started = true
		}
	})

	$petal.addClass('active')
}

const petals = $('[data-petal]').each((i, el)=>{

	const note = el.dataset.petal
	if (notes[note]) return;

	const $petal = $(`[data-petal="${note}"]`);

	notes[note] = {
		$audio:$('<audio></audio><audio>').prop({
			src: url(`notes/${el.dataset.petal}.mp3`),
			preload: 'auto',
		}), $petal
	}
		
	$petal.on('pointerdown', e=>{

		e.preventDefault()

		play(note);

		pointers[e.pointerId]=note;

	}).on('pointerenter', e =>{

		$petal.addClass('hover');

		if (pointers[e.pointerId]) play(note);

	}).on('pointerleave', e =>{

		$petal.removeClass('hover')

	}).on('transitionend', e=>{

		el.classList.remove('active')

	});
})

$win.on('pointerup pointercancel', e=>{

	delete pointers[e.pointerId]	
})

console.log()