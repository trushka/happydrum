const $=jQuery, $win = $(window);

function url(url) {
	return new URL(url, import.meta.url).href
};
//function

const container=$('#hdrum-vidget');

const notes=[], volume0 = .6;

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

	$petal.removeClass('active');
	requestAnimationFrame(t=>$petal.addClass('active'))
}

$('.hd-drum svg').clone().prependTo('.hd-drum')
 .find('[data-petal]').removeAttr(('data-petal'))

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
		
	$petal.on('pointerdown', function(e){

		play(note);

		let lastNote = note;

		this.setPointerCapture(e.pointerId)

		if (note) $(this).on('pointermove', function(e){

			const targ = document.elementFromPoint(e.clientX, e.clientY).parentNode;
			const note = targ.dataset.petal;

			if (note==lastNote || !note>0) return;

			petals.removeClass('hover');
			targ.classList.add('hover');
			play(note);

			lastNote = note;
		})

	}).on('pointerenter', e =>{

		$petal.addClass('hover');

	}).on('pointerleave', e =>{

		petals.removeClass('hover')

	}).on('transitionend', e=>{

		el.classList.remove('active')
	})

}).on('touchstart', e =>e.preventDefault());

$win.on('pointerup pointercancel blur', e=>{
	console.log(e.type)
	petals.off('pointermove')
})
console.log(`11`)