// Static anatomical SVG figures (front / back) ported from 穴道圖典.html.

const skin = "url(#skinGrad)";
const bamboo = "#C9A876";

export default function BodyFigure({ side }: { side: "front" | "back" }) {
  return (
    <>
      <defs>
        <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F1DEC6" />
          <stop offset="1" stopColor="#E3C6A6" />
        </linearGradient>
      </defs>

      {side === "front" ? (
        <g id="figureFront">
          <path d="M154 36 C160 16 240 16 246 36 C250 50 248 64 244 74 L156 74 C152 64 150 50 154 36 Z" fill="#3C3026" />
          <ellipse cx="200" cy="70" rx="46" ry="53" fill={skin} stroke={bamboo} strokeWidth="1" />
          <ellipse cx="152" cy="72" rx="7" ry="12" fill={skin} stroke={bamboo} strokeWidth="1" />
          <ellipse cx="248" cy="72" rx="7" ry="12" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M178 60 q8 -6 16 0" stroke="#6B5F50" strokeWidth="2" fill="none" />
          <path d="M206 60 q8 -6 16 0" stroke="#6B5F50" strokeWidth="2" fill="none" />
          <ellipse cx="186" cy="70" rx="4" ry="5" fill="#6B5F50" />
          <ellipse cx="214" cy="70" rx="4" ry="5" fill="#6B5F50" />
          <path d="M198 75 L195 88 q5 3 10 0" stroke={bamboo} strokeWidth="1.5" fill="none" />
          <path d="M188 98 q12 8 24 0" stroke="#6B5F50" strokeWidth="2" fill="none" />
          <path d="M182 110 L182 138 L218 138 L218 110 Z" fill={skin} />
          <path d="M130 150 C124 200 130 270 145 320 C150 360 153 385 162 402 L238 402 C247 385 250 360 255 320 C270 270 276 200 270 150 C250 128 150 128 130 150 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M170 175 C180 195 195 200 200 200 C205 200 220 195 230 175" stroke="#D4AD85" strokeWidth="1.5" fill="none" opacity="0.7" />
          <path d="M200 210 L200 380" stroke="#D4AD85" strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M135 150 C100 190 85 260 78 350 C75 400 78 450 85 495 L118 490 C122 450 124 400 122 350 C120 270 110 200 165 158 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M265 150 C300 190 315 260 322 350 C325 400 322 450 315 495 L282 490 C278 450 276 400 278 350 C280 270 290 200 235 158 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M82 492 C76 510 82 528 100 530 C116 531 124 518 120 498 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M318 492 C324 510 318 528 300 530 C284 531 276 518 280 498 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <g stroke={bamboo} strokeWidth="1" fill="none">
            <path d="M88 498 L80 515" />
            <path d="M98 503 L92 522" />
            <path d="M108 504 L106 525" />
            <path d="M117 500 L118 520" />
            <path d="M312 498 L320 515" />
            <path d="M302 503 L308 522" />
            <path d="M292 504 L294 525" />
            <path d="M283 500 L282 520" />
          </g>
          <path d="M162 405 C153 470 150 560 155 650 C158 720 162 790 168 855 L185 855 C190 790 193 720 196 650 C200 560 198 470 200 405 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M238 405 C247 470 250 560 245 650 C242 720 238 790 232 855 L215 855 C210 790 207 720 204 650 C200 560 202 470 200 405 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M158 605 q10 8 20 0" stroke="#D4AD85" strokeWidth="1" fill="none" opacity="0.6" />
          <path d="M222 605 q10 8 20 0" stroke="#D4AD85" strokeWidth="1" fill="none" opacity="0.6" />
          <path d="M163 855 C158 872 166 884 188 884 C206 884 210 873 202 856 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M237 855 C242 872 234 884 212 884 C194 884 190 873 198 856 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <g stroke={bamboo} strokeWidth="1" fill="none">
            <path d="M168 858 L162 875" />
            <path d="M178 860 L175 878" />
            <path d="M188 861 L188 880" />
            <path d="M198 860 L201 878" />
            <path d="M232 858 L238 875" />
            <path d="M222 860 L225 878" />
            <path d="M212 861 L212 880" />
            <path d="M202 860 L199 878" />
          </g>
        </g>
      ) : (
        <g id="figureBack">
          <ellipse cx="200" cy="68" rx="47" ry="54" fill="#3C3026" />
          <ellipse cx="152" cy="72" rx="7" ry="12" fill={skin} stroke={bamboo} strokeWidth="1" />
          <ellipse cx="248" cy="72" rx="7" ry="12" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M182 110 L182 138 L218 138 L218 110 Z" fill={skin} />
          <path d="M130 150 C124 200 130 270 145 320 C150 360 153 385 162 402 L238 402 C247 385 250 360 255 320 C270 270 276 200 270 150 C250 128 150 128 130 150 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M200 138 L200 400" stroke="#D4AD85" strokeWidth="1.5" fill="none" opacity="0.7" />
          <path d="M165 175 C175 195 185 210 195 215" stroke="#D4AD85" strokeWidth="1" fill="none" opacity="0.6" />
          <path d="M235 175 C225 195 215 210 205 215" stroke="#D4AD85" strokeWidth="1" fill="none" opacity="0.6" />
          <path d="M165 360 C175 395 195 400 200 400" stroke="#D4AD85" strokeWidth="1" fill="none" opacity="0.6" />
          <path d="M235 360 C225 395 205 400 200 400" stroke="#D4AD85" strokeWidth="1" fill="none" opacity="0.6" />
          <path d="M135 150 C100 190 85 260 78 350 C75 400 78 450 85 495 L118 490 C122 450 124 400 122 350 C120 270 110 200 165 158 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M265 150 C300 190 315 260 322 350 C325 400 322 450 315 495 L282 490 C278 450 276 400 278 350 C280 270 290 200 235 158 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M82 492 C76 510 82 528 100 530 C116 531 124 518 120 498 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M318 492 C324 510 318 528 300 530 C284 531 276 518 280 498 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M162 405 C153 470 150 560 155 650 C158 720 162 790 168 855 L185 855 C190 790 193 720 196 650 C200 560 198 470 200 405 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M238 405 C247 470 250 560 245 650 C242 720 238 790 232 855 L215 855 C210 790 207 720 204 650 C200 560 202 470 200 405 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M170 480 C175 550 178 600 178 650" stroke="#D4AD85" strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M230 480 C225 550 222 600 222 650" stroke="#D4AD85" strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M163 855 C158 872 166 884 185 884 C200 884 200 873 200 860 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
          <path d="M237 855 C242 872 234 884 215 884 C200 884 200 873 200 860 Z" fill={skin} stroke={bamboo} strokeWidth="1" />
        </g>
      )}
    </>
  );
}
