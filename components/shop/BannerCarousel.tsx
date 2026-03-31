'use client'

import { useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type ImgMeta = { file: string; wide?: boolean; full?: boolean }

// wide = 1000×500 (16:9), square = 1000×1000 (1:1)
const IMAGES: ImgMeta[] = [
  { file: 'img_211404_ecd8f0a508a55bb02cb91f242aa33ce5_2.png', wide: true },
  { file: 'img_211405_94f9a35e8362005feb3c4476872ce3f4_2.png', wide: true },
  { file: 'img_218160_60a1ec0877ee1c602a65c9af11c4f321_2.png', wide: true },
  { file: 'img_218161_e510b38b24bd45c4b6d79cf90df1dba7_2.png', wide: true },
  { file: 'img_218221_c56cc0011380406217b0750a5bf540e8_2.png', wide: true },
  { file: 'img_218386_8431a12ac6357bae7a32c12924066639_2.png', wide: false },
  { file: 'img_218736_ee33f82236cf452c94195e190d2e4a50_2.png', wide: false },
  { file: 'img_218737_15398a6ec435423ec3975762de4221e0_2.png', wide: false },
  { file: 'img_218745_0003d48791dc86165647abcdacf6af2a_2.png', wide: true },
  { file: 'img_218919_8eb1402c5aaaa70739cb67ebe61205f4_2.png', wide: true },
  { file: 'img_218920_1fa181c243da3163f55a8b0228233ce3_2.png', wide: false },
  { file: 'img_218922_0ac5689c317a84a782b0dda55f5e01ff_2.png', wide: false },
  { file: 'img_218923_819b90aa4b37a74ee7f0109db736be0d_2.png', wide: false },
  { file: 'img_218924_01794d8195e3f1dde7af42cb95d21266_2.png', wide: false },
  { file: 'img_218925_cdaf2a48721a14faeb2007e58c08c181_2.png', wide: false },
  { file: 'img_218927_3fdba2687718b6e306df9ca3fe961854_2.png', wide: true },
  { file: 'img_218928_699bba65e38dc24b528c68f34bf69d77_2.png', wide: true },
  { file: 'img_219001_796655b08db9a16e9fe640f2c1ec5e1a_2.png', wide: false },
  { file: 'img_219002_b5cd5571a9e8c89668e47c39dd3a96e7_2.png', wide: false },
  { file: 'img_219320_eb832648fe6870abfbea20fd6f8859cd_2.png', wide: true },
  { file: 'img_219335_ebcf2b0b787d02775fbec2f90d640f26_2.png', wide: true },
  { file: 'img_219839_d3070586c2be5f8ff003767d9af170ba_2.png', wide: true },
  { file: 'img_219852_d3099637e6106d3fbe5105f15ad85447_2.png', wide: true },
  { file: 'img_221039_07d188276d618ceff6bfd1e7e526a745_2.png', wide: false },
  { file: 'img_221087_04521f36e69b00a7a75bb1e5fa11e68a_2.png', wide: true },
  { file: 'img_221088_686a430871cc1b5cdcf33bc5100830d8_2.png', wide: false },
  { file: 'img_221089_8df7756e45b0acf49ee5b76da83e26dd_2.png', wide: false },
  { file: 'img_221145_2a939364059ae30e1f103e0f200e707e_2.png', wide: true },
  { file: 'img_221146_eca564f2b83d8e632d605473fe68ef81_2.png', wide: true },
  { file: 'img_221449_2c736fc43c87c72772d6dc8e70576051_2.png', wide: false },
  { file: 'img_221450_a3844ecc56f14a63146c95a4f1714ef7_2.png', wide: false },
  { file: 'img_221451_9367675c74cb08854463a3d2ea01203e_2.png', wide: true },
  { file: 'img_221453_59a9a90d2d386b44262ef32acb7ba9d3_2.png', wide: true },
  { file: 'img_221454_f1e7a8b719f54e6322c4a87ec5be192b_2.png', wide: true },
  { file: 'img_221455_67cfa31c1d84000c1999d1d8ea70e032_2.png', wide: false },
  { file: 'img_221458_0a876c87600a7922977fa01d09adc020_2.png', full: true },
  { file: 'img_222093_53286c395aa74e062cf94b076e5f68ed_2.png', full: true },
  { file: 'img_222872_ea6047433cd60ba9f6627a9f78109a3e_2.png', wide: false },
  { file: 'img_222873_3b325ca1d19ffcaa33285bca681f4741_2.png', wide: false },
  { file: 'img_222874_1028b92f68f8325db6d57c8e6f7b87d9_2.png', wide: true },
  { file: 'img_222951_71bc78e912d4709e292a24127ad229e6_2.png', wide: true },
  { file: 'img_222952_5e5980c1f2c582a3a4b08419542c2fcb_2.png', wide: false },
  { file: 'img_222970_510efe64a30cda016b3886575d923845_2.png', wide: true },
  { file: 'img_223024_3b9b3deef34c91a0dde0ab827ad14942_2.png', wide: true },
  { file: 'img_223025_2ee8fff27e1c262aae93cd64ee9727bd_2.png', wide: false },
  { file: 'img_223026_2c44650ba313fa5d0a421ff61824d6d3_2.png', wide: false },
  { file: 'img_223152_99f1aa451e5794a7be70d7b91a936bbb_2.png', wide: true },
  { file: 'img_223153_32d2beaeca5c9d35b377c08ec4275ead_2.png', wide: true },
  { file: 'img_223327_bf0004f65213a34db2369de23ce07f7d_2.png', wide: false },
  { file: 'img_223328_5b10b87dfc9c70ad24a5d2c33d2f00ce_2.png', wide: false },
  { file: 'img_223329_7bfbeeaef7185c29d438267f259b525d_2.png', wide: true },
  { file: 'img_223499_b0cc9fd6ad7b1a6d810b84cf227a788b_2.png', wide: true },
  { file: 'img_223500_1d1164a04507744a7aabf71b8d697c00_2.jpg', wide: true },
  { file: 'img_223689_d355e9be33e9f016288157f5b4bc72c5_2.png', full: true },
  { file: 'img_222953_afbd41f519181f37df9449eb5a650c75_2.png', wide: false },
]

// Build slides: each slide has at most 2 rows of 3 columns.
// Wide image = full row (3 cols). Square image = 1 col.
// Greedy: consume images until 2 rows are filled.
type Slide = ImgMeta[]

function buildSlides(images: ImgMeta[]): Slide[] {
  const slides: Slide[] = []
  let i = 0

  while (i < images.length) {
    const slide: ImgMeta[] = []
    let rowsFilled = 0

    while (i < images.length && rowsFilled < 2) {
      const img = images[i]
      if (img.wide) {
        // wide fills an entire row
        slide.push(img)
        i++
        rowsFilled++
      } else {
        // collect up to 3 squares to fill one row
        let rowCols = 0
        while (i < images.length && !images[i].wide && rowCols < 2) {
          slide.push(images[i])
          i++
          rowCols++
        }
        rowsFilled++
      }
    }

    if (slide.length > 0) slides.push(slide)
  }

  return slides
}

const slides: Slide[] = [
  // Слайд 1
  [
    { file: 'img_223499_b0cc9fd6ad7b1a6d810b84cf227a788b_2.png', wide: true },
    { file: 'img_223500_1d1164a04507744a7aabf71b8d697c00_2.jpg', wide: true },
  ],
  // Слайд 2
  [
    { file: 'img_223024_3b9b3deef34c91a0dde0ab827ad14942_2.png', wide: true },
    { file: 'img_223025_2ee8fff27e1c262aae93cd64ee9727bd_2.png', wide: false },
    { file: 'img_223026_2c44650ba313fa5d0a421ff61824d6d3_2.png', wide: false },

  ],
  // Слайд 3
  [
    { file: 'img_223153_32d2beaeca5c9d35b377c08ec4275ead_2.png', wide: true },
    { file: 'img_223152_99f1aa451e5794a7be70d7b91a936bbb_2.png', wide: true },
  ],
  // Слайд 4
  [
    { file: 'img_222951_71bc78e912d4709e292a24127ad229e6_2.png', wide: true },
    { file: 'img_222952_5e5980c1f2c582a3a4b08419542c2fcb_2.png', wide: false },
    { file: 'img_222953_afbd41f519181f37df9449eb5a650c75_2.png', wide: false },
  ],
  // Слайд 5
  [
    { file: 'img_222872_ea6047433cd60ba9f6627a9f78109a3e_2.png', wide: false },
    { file: 'img_222873_3b325ca1d19ffcaa33285bca681f4741_2.png', wide: false },
    { file: 'img_222874_1028b92f68f8325db6d57c8e6f7b87d9_2.png', wide: true },
  ],
  // Слайд 6
  [
    { file: 'img_222093_53286c395aa74e062cf94b076e5f68ed_2.png', full: true },
  ],
  // Слайд 7
  [
    { file: 'img_223327_bf0004f65213a34db2369de23ce07f7d_2.png', wide: false },
    { file: 'img_223328_5b10b87dfc9c70ad24a5d2c33d2f00ce_2.png', wide: false },
    { file: 'img_223329_7bfbeeaef7185c29d438267f259b525d_2.png', wide: true },
  ],
  // Слайд 8
  [
    { file: 'img_223689_d355e9be33e9f016288157f5b4bc72c5_2.png', full: true },
  ],
  // Слайд 9
  [
    { file: 'img_211404_ecd8f0a508a55bb02cb91f242aa33ce5_2.png', wide: true },
    { file: 'img_211405_94f9a35e8362005feb3c4476872ce3f4_2.png', wide: true },
  ],
  // Слайд 10
  [
    { file: 'img_221458_0a876c87600a7922977fa01d09adc020_2.png', full: true },
  ],
  // Слайд 11
  [
    { file: 'img_221145_2a939364059ae30e1f103e0f200e707e_2.png', wide: true },
    { file: 'img_221146_eca564f2b83d8e632d605473fe68ef81_2.png', wide: true },
  ],
  // Слайд 12
  [
    { file: 'img_221455_67cfa31c1d84000c1999d1d8ea70e032_2.png', full: true },
  ],
  // Слайд 13
  [
    { file: 'img_221449_2c736fc43c87c72772d6dc8e70576051_2.png', wide: false },
    { file: 'img_221450_a3844ecc56f14a63146c95a4f1714ef7_2.png', wide: false },
    { file: 'img_221451_9367675c74cb08854463a3d2ea01203e_2.png', wide: true },
  ],
  // Слайд 14
  [
    { file: 'img_221087_04521f36e69b00a7a75bb1e5fa11e68a_2.png', wide: true },
    { file: 'img_221088_686a430871cc1b5cdcf33bc5100830d8_2.png', wide: false },
    { file: 'img_221089_8df7756e45b0acf49ee5b76da83e26dd_2.png', wide: false },
  ],
  // Слайд 15
  [
    { file: 'img_219839_d3070586c2be5f8ff003767d9af170ba_2.png', wide: true },
    { file: 'img_219852_d3099637e6106d3fbe5105f15ad85447_2.png', wide: true },
  ],
  // Слайд 16
  [
    { file: 'img_218919_8eb1402c5aaaa70739cb67ebe61205f4_2.png', wide: true },
    { file: 'img_218920_1fa181c243da3163f55a8b0228233ce3_2.png', wide: false },
    { file: 'img_221039_07d188276d618ceff6bfd1e7e526a745_2.png', wide: false },
  ],
  // Слайд 17
  [
    { file: 'img_219320_eb832648fe6870abfbea20fd6f8859cd_2.png', wide: true },
    { file: 'img_219335_ebcf2b0b787d02775fbec2f90d640f26_2.png', wide: true },
  ],
  // Слайд 18
  [
    { file: 'img_218922_0ac5689c317a84a782b0dda55f5e01ff_2.png', wide: false },
    { file: 'img_218923_819b90aa4b37a74ee7f0109db736be0d_2.png', wide: false },
    { file: 'img_218924_01794d8195e3f1dde7af42cb95d21266_2.png', wide: false },
    { file: 'img_218925_cdaf2a48721a14faeb2007e58c08c181_2.png', wide: false },
  ],
  // Слайд 19
  [
    { file: 'img_218927_3fdba2687718b6e306df9ca3fe961854_2.png', wide: true },
    { file: 'img_218928_699bba65e38dc24b528c68f34bf69d77_2.png', wide: true },
  ],
  // Слайд 20
  [
    { file: 'img_219001_796655b08db9a16e9fe640f2c1ec5e1a_2.png', wide: false },
    { file: 'img_219002_b5cd5571a9e8c89668e47c39dd3a96e7_2.png', wide: false },
    { file: 'img_221454_f1e7a8b719f54e6322c4a87ec5be192b_2.png', wide: true },
  ],
  // Слайд 21
  [
    { file: 'img_218221_c56cc0011380406217b0750a5bf540e8_2.png', wide: true },
    { file: 'img_218736_ee33f82236cf452c94195e190d2e4a50_2.png', wide: false },
    { file: 'img_218737_15398a6ec435423ec3975762de4221e0_2.png', wide: false },
  ],
  // Слайд 22
  [
    { file: 'img_218386_8431a12ac6357bae7a32c12924066639_2.png', full: true },
  ],
  // Слайд 23
  [
    { file: 'img_218745_0003d48791dc86165647abcdacf6af2a_2.png', wide: true },
    { file: 'img_221453_59a9a90d2d386b44262ef32acb7ba9d3_2.png', wide: true },
  ],
  // Слайд 24
    [{ file: 'img_218160_60a1ec0877ee1c602a65c9af11c4f321_2.png', wide: true },
     { file: 'img_218161_e510b38b24bd45c4b6d79cf90df1dba7_2.png', wide: true },
    ],
  // Слайд 25
    [{ file: 'img_222930_faf2e3dc3118cf8605d675cff732e77a_2.png', full: true },
    ],
]

// Layout for a slide: figure out rendering grid
// We re-process each slide's images to assign col spans
type Cell = { img: ImgMeta; span: 1 | 2 }

function layoutSlide(slide: ImgMeta[]): Cell[][] {
  const rows: Cell[][] = []
  let i = 0

  while (i < slide.length) {
    const img = slide[i]
    if (img.wide || img.full) {
      // wide (16:9) or full (square stretched to full width) — both span 2 cols
      rows.push([{ img, span: 2 }])
      i++
    } else {
      // collect up to 2 squares for this row
      const row: Cell[] = []
      while (i < slide.length && !slide[i].wide && !slide[i].full && row.length < 2) {
        row.push({ img: slide[i], span: 1 })
        i++
      }
      if (row.length > 0) rows.push(row)
    }
  }

  return rows
}

const SLIDE_WIDTH = 420 // px per slide
const SLIDE_GAP = 16    // gap-4
const SLIDE_STEP = SLIDE_WIDTH + SLIDE_GAP
const SPEED = 0.4       // px per frame

function SlidePanel({ slide }: { slide: Slide }) {
  const layout = layoutSlide(slide)
  return (
    <div className="flex flex-col gap-2 shrink-0" style={{ width: SLIDE_WIDTH }}>
      {layout.map((row, ri) => (
        <div key={ri} className="grid grid-cols-2 gap-2">
          {row.map((cell, ci) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={ci}
              src={`/carusel/${cell.img.file}`}
              alt=""
              className={`w-full object-cover ${
                cell.span === 2
                  ? `col-span-2 ${cell.img.full ? 'aspect-square' : 'aspect-[2/1]'}`
                  : 'col-span-1 aspect-square'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function BannerCarousel() {
  const trackRef = useRef<HTMLDivElement>(null)
  const isPaused = useRef(false)
  const rafRef = useRef<number>(0)

  const tripled = [...slides, ...slides, ...slides]
  const singleWidth = slides.length * SLIDE_STEP

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    el.scrollLeft = singleWidth

    function tick() {
      if (!isPaused.current && el) {
        el.scrollLeft += SPEED
        if (el.scrollLeft >= singleWidth * 2) el.scrollLeft -= singleWidth
        if (el.scrollLeft <= 0) el.scrollLeft += singleWidth
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [singleWidth])

  function scroll(dir: 'prev' | 'next') {
    const el = trackRef.current
    if (!el) return
    const target = el.scrollLeft + (dir === 'next' ? SLIDE_STEP * 3 : -SLIDE_STEP * 3)
    smoothScrollTo(el, target, 600)
  }

  function smoothScrollTo(el: HTMLDivElement, target: number, duration: number) {
    const start = el.scrollLeft
    const diff = target - start
    const startTime = performance.now()
    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      el.scrollLeft = start + diff * ease
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseEnter={() => { isPaused.current = true }}
        onMouseLeave={() => { isPaused.current = false }}
        onTouchStart={() => { isPaused.current = true }}
        onTouchEnd={() => { setTimeout(() => { isPaused.current = false }, 1500) }}
      >
        {tripled.map((slide, i) => (
          <SlidePanel key={i} slide={slide} />
        ))}
      </div>

      <button
        onClick={() => scroll('prev')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-[#020104] border border-[#1e181d] text-[#7a7078] hover:border-[#c5a028] hover:text-[#c5a028] flex items-center justify-center transition-colors duration-300 z-10"
        aria-label="Previous"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        onClick={() => scroll('next')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-[#020104] border border-[#1e181d] text-[#7a7078] hover:border-[#c5a028] hover:text-[#c5a028] flex items-center justify-center transition-colors duration-300 z-10"
        aria-label="Next"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
