// Acupoint atlas data — ported from the standalone 穴道圖典.html

export interface Point {
  id: string;
  name: string;
  py: string;
  meridian: string;
  view: "front" | "back";
  x: number;
  y: number;
  location: string;
  action: string;
  indications: string;
  // Optional note for points whose取穴 or safety differs by sex / pregnancy.
  genderNote?: string;
}

export interface Formula {
  name: string;
  pattern: string;
  composition: string;
  usage: string;
  notes: string;
}

export interface SymptomGroup {
  id: string;
  name: string;
  category: string;
  description: string;
  formulas: Formula[];
  points: string[];
}

export const MERIDIAN_COLORS: Record<string, string> = {
  督脈: "#B5402E",
  任脈: "#5C7A5C",
  手太陰肺經: "#7E9CC4",
  手陽明大腸經: "#C9A876",
  足陽明胃經: "#A8835C",
  足太陰脾經: "#5C8B7A",
  手少陰心經: "#A85C7A",
  手太陽小腸經: "#B98A6A",
  足太陽膀胱經: "#5C7AA8",
  足少陰腎經: "#6B8E4E",
  手厥陰心包經: "#7A5CA8",
  手少陽三焦經: "#9A7AC9",
  足少陽膽經: "#4FA39A",
  足厥陰肝經: "#7AA85C",
  經外奇穴: "#8A8273",
};

export const SYMPTOM_CATEGORIES: Record<string, string> = {
  外感類: "#B5402E",
  肺系類: "#5C8B7A",
  脾胃類: "#A8835C",
  婦科類: "#A85C7A",
  神志類: "#7A5CA8",
  肝腎類: "#5C7AA8",
};

export const POINTS: Point[] = [
  // ---- FRONT VIEW ----
  { id: "GV20", name: "百會", py: "Bǎihuì", meridian: "督脈", view: "front", x: 200, y: 12, location: "頭頂正中，兩耳尖連線與正中線交點。", action: "升陽舉陷、開竅醒腦、平肝熄風。", indications: "頭痛、眩暈、健忘、中風、脫肛、提神醒腦。" },
  { id: "EX-HN3", name: "印堂", py: "Yìntáng", meridian: "經外奇穴", view: "front", x: 200, y: 42, location: "兩眉頭連線中點。", action: "鎮靜安神、明目通鼻。", indications: "頭痛、眩暈、鼻塞、失眠、小兒驚風。" },
  { id: "GB14", name: "陽白", py: "Yángbái", meridian: "足少陽膽經", view: "front", x: 188, y: 38, location: "眉中直上一寸，瞳孔正上方。", action: "疏風清熱、明目。", indications: "頭痛、眼瞼下垂、目眩、面癱。" },
  { id: "EX-HN5", name: "太陽", py: "Tàiyáng", meridian: "經外奇穴", view: "front", x: 223, y: 50, location: "眉梢與外眼角間，向後約一橫指凹陷處。", action: "清肝明目、止頭痛。", indications: "偏頭痛、目赤腫痛、三叉神經痛。" },
  { id: "BL2", name: "攢竹", py: "Cuánzhú", meridian: "足太陽膀胱經", view: "front", x: 192, y: 40, location: "眉頭凹陷處。", action: "疏風明目、止痛。", indications: "頭痛、眼疲勞、流淚、眼瞼痙攣。" },
  { id: "ST2", name: "四白", py: "Sìbái", meridian: "足陽明胃經", view: "front", x: 190, y: 56, location: "瞳孔直下，眶下孔處。", action: "祛風明目、通經活絡。", indications: "面癱、眼瞼跳動、鼻竇炎、黑眼圈。" },
  { id: "SI18", name: "顴髎", py: "Quánliáo", meridian: "手太陽小腸經", view: "front", x: 215, y: 64, location: "顴骨下緣，外眼角直下凹陷處。", action: "祛風鎮痛、消腫。", indications: "面癱、牙痛、面部痙攣。" },
  { id: "LI20", name: "迎香", py: "Yíngxiāng", meridian: "手陽明大腸經", view: "front", x: 193, y: 68, location: "鼻翼外緣中點旁，鼻唇溝中。", action: "宣通鼻竅、疏散風熱。", indications: "鼻塞、鼻炎、面癱、面部腫痛。" },
  { id: "GV26", name: "人中", py: "Rénzhōng", meridian: "督脈", view: "front", x: 200, y: 73, location: "人中溝上三分之一與下三分之二交點。", action: "開竅醒神、清熱。", indications: "昏迷急救、中風、面腫、牙齦腫痛。" },
  { id: "TE23", name: "絲竹空", py: "Sīzhúkōng", meridian: "手少陽三焦經", view: "front", x: 212, y: 47, location: "眉梢凹陷處。", action: "清頭明目、疏風止痛。", indications: "偏頭痛、眼疾、面癱。" },
  { id: "CV23", name: "廉泉", py: "Liánquán", meridian: "任脈", view: "front", x: 200, y: 92, location: "喉結上方，舌骨上緣凹陷處。", action: "利喉開竅、化痰。", indications: "咽喉腫痛、語言不利、流涎。" },
  { id: "CV22", name: "天突", py: "Tiāntū", meridian: "任脈", view: "front", x: 200, y: 104, location: "胸骨上窩正中。", action: "宣肺平喘、利咽。", indications: "咳嗽、氣喘、咽喉腫痛、聲音嘶啞。" },
  { id: "KI27", name: "俞府", py: "Shùfǔ", meridian: "足少陰腎經", view: "front", x: 188, y: 120, location: "鎖骨下緣，前正中線旁開二寸。", action: "止咳平喘、和胃降逆。", indications: "咳嗽、氣喘、嘔吐、胸痛。" },
  { id: "LU1", name: "中府", py: "Zhōngfǔ", meridian: "手太陰肺經", view: "front", x: 167, y: 140, location: "鎖骨外側下方，第一肋間隙。", action: "宣肺理氣、止咳化痰。", indications: "咳嗽、氣喘、胸痛、肩背痛。" },
  { id: "LR14", name: "期門", py: "Qīmén", meridian: "足厥陰肝經", view: "front", x: 174, y: 196, location: "乳頭直下，第六肋間隙。", action: "疏肝理氣、健脾和胃。", indications: "胸脅脹痛、嘔吐、情緒鬱結。" },
  { id: "CV17", name: "膻中", py: "Dànzhōng", meridian: "任脈", view: "front", x: 200, y: 166, location: "兩乳頭連線中點，胸骨正中。", action: "寬胸理氣、止咳化痰。", indications: "咳嗽、氣喘、胸悶、心悸、乳房脹痛。", genderNote: "定位男女有別：「兩乳頭連線中點」以男性為準；女性乳房位置因人而異，宜改以胸骨中線、平第 4 肋間（約第 4、5 肋間）取穴。" },
  { id: "CV12", name: "中脘", py: "Zhōngwǎn", meridian: "任脈", view: "front", x: 200, y: 230, location: "臍上四寸，前正中線上。", action: "健脾和胃、消食導滯。", indications: "胃痛、腹脹、消化不良、嘔吐。" },
  { id: "ST25", name: "天樞", py: "Tiānshū", meridian: "足陽明胃經", view: "front", x: 176, y: 258, location: "臍旁開二寸。", action: "調理腸胃、理氣消滯。", indications: "腹脹、腹瀉、便秘、月經不調。" },
  { id: "CV6", name: "氣海", py: "Qìhǎi", meridian: "任脈", view: "front", x: 200, y: 272, location: "臍下一寸半，前正中線上。", action: "補氣益腎、培補元氣。", indications: "腹痛、虛勞、月經不調、遺尿。" },
  { id: "CV4", name: "關元", py: "Guānyuán", meridian: "任脈", view: "front", x: 200, y: 286, location: "臍下三寸，前正中線上。", action: "溫補腎陽、培元固本。", indications: "小腹冷痛、月經不調、遺尿、虛勞。" },
  { id: "LI15", name: "肩髃", py: "Jiānyú", meridian: "手陽明大腸經", view: "front", x: 143, y: 130, location: "肩部，三角肌上，肩峰與肱骨大結節間凹陷。", action: "祛風通絡、利關節。", indications: "肩臂痛、肩周炎、上肢不遂。" },
  { id: "LU5", name: "尺澤", py: "Chǐzé", meridian: "手太陰肺經", view: "front", x: 125, y: 243, location: "肘橫紋上，肱二頭肌腱橈側凹陷。", action: "清肺瀉熱、止咳平喘。", indications: "咳嗽、氣喘、咽喉腫痛、肘臂痛。" },
  { id: "PC3", name: "曲澤", py: "Qūzé", meridian: "手厥陰心包經", view: "front", x: 129, y: 248, location: "肘橫紋中，肱二頭肌腱尺側緣。", action: "清心瀉火、和胃降逆。", indications: "心痛、心悸、嘔吐、肘臂痛。" },
  { id: "HT3", name: "少海", py: "Shàohǎi", meridian: "手少陰心經", view: "front", x: 135, y: 251, location: "肘橫紋尺側端，肱骨內上髁前緣。", action: "寧心安神、通絡止痛。", indications: "心痛、肘臂攣痛、手顫。" },
  { id: "LI11", name: "曲池", py: "Qūchí", meridian: "手陽明大腸經", view: "front", x: 118, y: 239, location: "屈肘，肘橫紋外端凹陷處。", action: "清熱解表、調和氣血。", indications: "發熱、皮膚病、肩肘關節痛、高血壓。" },
  { id: "PC6", name: "內關", py: "Nèiguān", meridian: "手厥陰心包經", view: "front", x: 111, y: 272, location: "腕橫紋上二寸，兩筋之間。", action: "寧心安神、和胃降逆、理氣止痛。", indications: "心悸、胸悶、噁心嘔吐、暈車、失眠。" },
  { id: "LU7", name: "列缺", py: "Lièquē", meridian: "手太陰肺經", view: "front", x: 103, y: 285, location: "橈骨莖突上方，腕橫紋上1.5寸。", action: "宣肺解表、通調任脈。", indications: "咳嗽、氣喘、頭痛、頸項僵硬。" },
  { id: "LU9", name: "太淵", py: "Tàiyuān", meridian: "手太陰肺經", view: "front", x: 101, y: 288, location: "腕掌側橫紋橈側，橈動脈搏動處。", action: "補肺益氣、止咳化痰。", indications: "咳嗽、氣喘、無脈症、腕痛。" },
  { id: "HT7", name: "神門", py: "Shénmén", meridian: "手少陰心經", view: "front", x: 110, y: 291, location: "腕掌側橫紋尺側端凹陷。", action: "寧心安神、清心瀉火。", indications: "失眠、健忘、心悸、焦慮。" },
  { id: "LI4", name: "合谷", py: "Hégǔ", meridian: "手陽明大腸經", view: "front", x: 97, y: 309, location: "手背第一、二掌骨間，第二掌骨橈側中點。", action: "疏風解表、清熱止痛。", indications: "頭痛、牙痛、感冒發熱、便秘（孕婦慎用）。", genderNote: "孕婦慎用／忌強刺激：與三陰交合用易催產、動胎氣，懷孕期間避免針刺或重按。" },
  { id: "PC8", name: "勞宮", py: "Láogōng", meridian: "手厥陰心包經", view: "front", x: 101, y: 316, location: "掌心，第二、三掌骨間，握拳中指尖處。", action: "清心瀉熱、開竅醒神。", indications: "口瘡、心煩、中暑、手心多汗。" },
  { id: "LU11", name: "少商", py: "Shàoshāng", meridian: "手太陰肺經", view: "front", x: 93, y: 301, location: "拇指橈側指甲角旁0.1寸。", action: "清肺利咽、開竅醒神。", indications: "咽喉腫痛、咳嗽、高熱昏迷。" },
  { id: "SI3", name: "後溪", py: "Hòuxī", meridian: "手太陽小腸經", view: "front", x: 108, y: 320, location: "手掌尺側，第五掌指關節後方紋頭凹陷。", action: "通督脈、清熱截瘧。", indications: "頸項強痛、落枕、腰背痛、耳聾。" },
  { id: "SP10", name: "血海", py: "Xuèhǎi", meridian: "足太陰脾經", view: "front", x: 178, y: 400, location: "大腿內側，髕骨內上緣上二寸。", action: "調經統血、祛風除濕。", indications: "月經不調、痛經、皮膚搔癢、膝痛。" },
  { id: "LR8", name: "曲泉", py: "Qūquán", meridian: "足厥陰肝經", view: "front", x: 178, y: 425, location: "膝內側，膕橫紋內側端。", action: "疏肝理氣、清濕熱。", indications: "月經不調、膝痛、小便不利。" },
  { id: "GB34", name: "陽陵泉", py: "Yánglíngquán", meridian: "足少陽膽經", view: "front", x: 242, y: 448, location: "膝下，腓骨頭前下方凹陷。", action: "疏肝利膽、舒筋活絡。", indications: "膝痛、坐骨神經痛、肝膽疾患、抽筋。" },
  { id: "ST36", name: "足三里", py: "Zúsānlǐ", meridian: "足陽明胃經", view: "front", x: 180, y: 453, location: "膝下三寸，脛骨前緣外一橫指。", action: "健脾和胃、補中益氣、扶正培元。", indications: "胃痛、消化不良、疲勞、養生保健第一要穴。" },
  { id: "SP9", name: "陰陵泉", py: "Yīnlíngquán", meridian: "足太陰脾經", view: "front", x: 187, y: 456, location: "小腿內側，脛骨內側髁後下方凹陷。", action: "健脾利水、消腫。", indications: "水腫、小便不利、膝痛、腹脹。" },
  { id: "SP6", name: "三陰交", py: "Sānyīnjiāo", meridian: "足太陰脾經", view: "front", x: 181, y: 525, location: "內踝尖上三寸，脛骨內側緣後方。", action: "健脾益血、調補肝腎、安神。", indications: "月經不調、痛經、失眠、下肢水腫（孕婦禁針）。", genderNote: "婦科要穴，但孕婦禁針、禁強刺激：易引發子宮收縮、動胎氣，懷孕期間務必避免。" },
  { id: "KI3", name: "太溪", py: "Tàixī", meridian: "足少陰腎經", view: "front", x: 185, y: 545, location: "內踝尖與跟腱之間凹陷處。", action: "滋補腎陰、培補元氣。", indications: "腰痛、耳鳴、失眠、足跟痛。" },
  { id: "KI6", name: "照海", py: "Zhàohǎi", meridian: "足少陰腎經", view: "front", x: 185, y: 553, location: "內踝尖下方凹陷處。", action: "滋陰清熱、調補沖任。", indications: "咽喉乾痛、失眠、月經不調。" },
  { id: "GB39", name: "懸鐘", py: "Xuánzhōng", meridian: "足少陽膽經", view: "front", x: 230, y: 535, location: "外踝尖上三寸，腓骨前緣。", action: "疏肝益腎、舒筋活絡。", indications: "頸項強痛、踝關節痛、下肢痿軟。" },
  { id: "SP3", name: "太白", py: "Tàibái", meridian: "足太陰脾經", view: "front", x: 176, y: 572, location: "足內側緣，第一蹠骨關節後下方凹陷。", action: "健脾化濕、理氣和胃。", indications: "腹脹、腹瀉、胃痛、體倦乏力。" },
  { id: "ST44", name: "內庭", py: "Nèitíng", meridian: "足陽明胃經", view: "front", x: 196, y: 578, location: "足背第二、三趾間縫紋端。", action: "清胃瀉火、理氣止痛。", indications: "牙痛、咽喉腫痛、胃痛、足背腫痛。" },
  { id: "LR3", name: "太衝", py: "Tàichōng", meridian: "足厥陰肝經", view: "front", x: 190, y: 572, location: "足背，第一、二蹠骨結合部前方凹陷。", action: "平肝熄風、疏肝理氣、清熱明目。", indications: "頭痛、眩暈、情緒煩躁、高血壓。" },
  { id: "GV24", name: "神庭", py: "Shéntíng", meridian: "督脈", view: "front", x: 200, y: 30, location: "前髮際正中直上0.5寸。", action: "鎮靜安神、清頭明目。", indications: "頭痛、眩暈、失眠、鼻淵、驚悸。" },
  { id: "CV8", name: "神闕", py: "Shénquè", meridian: "任脈", view: "front", x: 200, y: 258, location: "臍窩正中。", action: "溫陽固脫、健運脾胃。", indications: "腹痛、腹瀉、虛脫、水腫（多用灸法，禁針）。" },
  { id: "CV3", name: "中極", py: "Zhōngjí", meridian: "任脈", view: "front", x: 200, y: 297, location: "臍下四寸，前正中線上。", action: "益腎調經、通利膀胱。", indications: "小便不利、遺尿、月經不調、遺精。" },
  { id: "LI10", name: "手三里", py: "Shǒusānlǐ", meridian: "手陽明大腸經", view: "front", x: 112, y: 258, location: "曲池下二寸，陽溪與曲池連線上。", action: "通經活絡、消腫止痛。", indications: "肘臂痠痛、上肢不遂、腹痛、腹瀉。" },
  { id: "LI5", name: "陽溪", py: "Yángxī", meridian: "手陽明大腸經", view: "front", x: 96, y: 300, location: "腕背橈側，拇指上翹時兩肌腱間凹陷（鼻煙窩）。", action: "清熱散風、通利關節。", indications: "頭痛、目赤、牙痛、腕痛。" },
  { id: "LU10", name: "魚際", py: "Yújì", meridian: "手太陰肺經", view: "front", x: 96, y: 313, location: "第一掌骨橈側中點，赤白肉際處。", action: "清肺瀉熱、利咽。", indications: "咳嗽、咽喉腫痛、發熱、掌心熱。" },
  { id: "PC7", name: "大陵", py: "Dàlíng", meridian: "手厥陰心包經", view: "front", x: 107, y: 286, location: "腕掌側橫紋中央，兩筋之間。", action: "寧心安神、和胃寬胸。", indications: "心痛、心悸、失眠、胃痛、腕關節痛。" },
  { id: "ST34", name: "梁丘", py: "Liángqiū", meridian: "足陽明胃經", view: "front", x: 188, y: 428, location: "髕骨外上緣上二寸。", action: "和胃止痛、舒筋活絡。", indications: "急性胃痛、膝關節腫痛、乳癰。" },
  { id: "GB31", name: "風市", py: "Fēngshì", meridian: "足少陽膽經", view: "front", x: 252, y: 405, location: "大腿外側中線，直立垂手時中指尖所到處。", action: "祛風除濕、通經活絡。", indications: "下肢痿痺、半身不遂、遍身搔癢。" },
  { id: "ST40", name: "豐隆", py: "Fēnglóng", meridian: "足陽明胃經", view: "front", x: 198, y: 492, location: "外踝尖上八寸，脛骨前緣外二橫指。", action: "和胃氣、化痰濕。", indications: "咳嗽痰多、頭痛、眩暈、下肢腫痛。" },
  { id: "ST41", name: "解溪", py: "Jiěxī", meridian: "足陽明胃經", view: "front", x: 192, y: 556, location: "足背踝關節橫紋中央，兩肌腱之間凹陷。", action: "舒筋活絡、清胃化痰。", indications: "踝關節痛、足下垂、頭痛、腹脹。" },
  { id: "SP4", name: "公孫", py: "Gōngsūn", meridian: "足太陰脾經", view: "front", x: 172, y: 580, location: "足內側緣，第一蹠骨基底前下方赤白肉際。", action: "健脾和胃、通調沖脈。", indications: "胃痛、嘔吐、腹脹、腹瀉、心煩。" },
  { id: "LR2", name: "行間", py: "Xíngjiān", meridian: "足厥陰肝經", view: "front", x: 184, y: 582, location: "足背第一、二趾間，趾蹼緣後方赤白肉際。", action: "清瀉肝火、熄風寧神。", indications: "頭痛、目赤、脅痛、月經過多、失眠。" },
  { id: "BL1", name: "睛明", py: "Jīngmíng", meridian: "足太陽膀胱經", view: "front", x: 196, y: 50, location: "目內眥角稍上方凹陷處。", action: "明目退翳、祛風清熱。", indications: "目赤腫痛、流淚、近視、夜盲、視物模糊。" },
  { id: "ST1", name: "承泣", py: "Chéngqì", meridian: "足陽明胃經", view: "front", x: 190, y: 53, location: "瞳孔直下，眼球與眶下緣之間。", action: "祛風散邪、明目止淚。", indications: "目赤腫痛、流淚、眼瞼跳動、近視。" },
  { id: "ST4", name: "地倉", py: "Dìcāng", meridian: "足陽明胃經", view: "front", x: 193, y: 77, location: "口角旁開0.4寸，瞳孔直下。", action: "祛風通絡、舒筋活血。", indications: "口角喎斜、流涎、面癱、三叉神經痛。" },
  { id: "ST6", name: "頰車", py: "Jiáchē", meridian: "足陽明胃經", view: "front", x: 183, y: 81, location: "下頜角前上方一橫指，咬牙時咬肌隆起處。", action: "祛風清熱、開關通絡。", indications: "牙痛、面癱、牙關緊閉、腮腫。" },
  { id: "ST7", name: "下關", py: "Xiàguān", meridian: "足陽明胃經", view: "front", x: 211, y: 61, location: "顴弓下緣，下頜骨髁狀突前方凹陷處。", action: "消腫止痛、聰耳通絡。", indications: "牙痛、面癱、顳頜關節痛、耳鳴。" },
  { id: "CV9", name: "水分", py: "Shuǐfēn", meridian: "任脈", view: "front", x: 200, y: 249, location: "臍上一寸，前正中線上。", action: "利水消腫、健脾和胃。", indications: "水腫、腹脹、腹瀉、小便不利。" },
  { id: "SP15", name: "大橫", py: "Dàhéng", meridian: "足太陰脾經", view: "front", x: 162, y: 258, location: "臍旁開四寸。", action: "溫中散寒、調理腸胃。", indications: "腹脹、腹瀉、便秘、繞臍腹痛。" },
  { id: "LR13", name: "章門", py: "Zhāngmén", meridian: "足厥陰肝經", view: "front", x: 156, y: 232, location: "側腹部，第十一肋游離端下際。", action: "疏肝健脾、理氣散結。", indications: "腹脹、脅痛、消化不良、痞塊。" },
  { id: "GB26", name: "帶脈", py: "Dàimài", meridian: "足少陽膽經", view: "front", x: 151, y: 260, location: "第十一肋游離端直下，平臍處。", action: "調經止帶、健脾利濕。", indications: "月經不調、白帶過多、腰脅痛、疝氣。" },
  { id: "LI1", name: "商陽", py: "Shāngyáng", meridian: "手陽明大腸經", view: "front", x: 89, y: 316, location: "食指橈側指甲角旁0.1寸。", action: "清熱解表、開竅醒神。", indications: "咽喉腫痛、牙痛、發熱、昏迷急救。" },
  { id: "SI1", name: "少澤", py: "Shàozé", meridian: "手太陽小腸經", view: "front", x: 122, y: 322, location: "小指尺側指甲角旁0.1寸。", action: "清熱通乳、開竅利咽。", indications: "乳少、乳癰、咽喉腫痛、熱病昏迷。" },
  { id: "HT9", name: "少衝", py: "Shàochōng", meridian: "手少陰心經", view: "front", x: 116, y: 318, location: "小指橈側指甲角旁0.1寸。", action: "清心開竅、瀉熱醒神。", indications: "心悸、心痛、熱病、昏迷、癲狂。" },
  { id: "PC9", name: "中衝", py: "Zhōngchōng", meridian: "手厥陰心包經", view: "front", x: 96, y: 326, location: "中指末端最高點中央。", action: "開竅醒神、清心瀉熱。", indications: "中風昏迷、中暑、心痛、小兒驚風。" },

  // ---- BACK VIEW ----
  { id: "GV16", name: "風府", py: "Fēngfǔ", meridian: "督脈", view: "back", x: 200, y: 115, location: "後髮際正中直上一寸，枕骨下凹陷。", action: "祛風散邪、開竅醒腦。", indications: "頭痛、項強、感冒、中風失語。" },
  { id: "GB20", name: "風池", py: "Fēngchí", meridian: "足少陽膽經", view: "back", x: 187, y: 110, location: "後頸部，枕骨下，胸鎖乳突肌與斜方肌間凹陷。", action: "祛風解表、清頭明目。", indications: "頭痛、眩暈、感冒、頸項僵硬、失眠。" },
  { id: "GV14", name: "大椎", py: "Dàzhuī", meridian: "督脈", view: "back", x: 200, y: 128, location: "第七頸椎與第一胸椎棘突間凹陷。", action: "解表通陽、清熱截瘧。", indications: "感冒、發熱、咳嗽、頸背強痛。" },
  { id: "GB21", name: "肩井", py: "Jiānjǐng", meridian: "足少陽膽經", view: "back", x: 170, y: 122, location: "肩上，大椎與肩峰連線中點。", action: "祛風清熱、活絡消腫。", indications: "肩頸痠痛、落枕、上肢不遂（孕婦禁針）。" },
  { id: "SI11", name: "天宗", py: "Tiānzōng", meridian: "手太陽小腸經", view: "back", x: 166, y: 186, location: "肩胛骨中央，肩胛岡下窩中點。", action: "舒筋活絡、理氣消腫。", indications: "肩背痠痛、肩周炎、乳房脹痛。" },
  { id: "BL13", name: "肺俞", py: "Fèishù", meridian: "足太陽膀胱經", view: "back", x: 185, y: 172, location: "第三胸椎棘突下，旁開1.5寸。", action: "宣肺理氣、止咳平喘。", indications: "咳嗽、氣喘、感冒、背痛。" },
  { id: "BL23", name: "腎俞", py: "Shènshù", meridian: "足太陽膀胱經", view: "back", x: 186, y: 258, location: "第二腰椎棘突下，旁開1.5寸。", action: "益腎助陽、強腰利水。", indications: "腰痛、耳鳴、遺尿、月經不調。" },
  { id: "GV4", name: "命門", py: "Mìngmén", meridian: "督脈", view: "back", x: 200, y: 260, location: "第二腰椎棘突下，後正中線上。", action: "溫腎壯陽、強腰固本。", indications: "腰痛、遺尿、虛寒體質、月經不調。" },
  { id: "GB30", name: "環跳", py: "Huántiào", meridian: "足少陽膽經", view: "back", x: 236, y: 318, location: "側臀部，股骨大轉子最高點與骶管裂孔連線外1/3處。", action: "祛風除濕、舒筋活絡。", indications: "坐骨神經痛、腰腿痛、下肢痿痺。" },
  { id: "TE5", name: "外關", py: "Wàiguān", meridian: "手少陽三焦經", view: "back", x: 286, y: 272, location: "前臂背側，腕橫紋上二寸，尺橈骨之間。", action: "祛風解表、通經活絡。", indications: "感冒、頭痛、耳鳴、上肢痠痛。" },
  { id: "BL40", name: "委中", py: "Wěizhōng", meridian: "足太陽膀胱經", view: "back", x: 170, y: 408, location: "膕橫紋中點。", action: "舒筋活絡、清熱涼血。", indications: "腰背痛、膝關節痛、下肢痿軟。" },
  { id: "BL60", name: "崑崙", py: "Kūnlún", meridian: "足太陽膀胱經", view: "back", x: 170, y: 540, location: "外踝尖與跟腱之間凹陷處。", action: "舒筋活絡、清熱消腫。", indications: "頭痛、腰背痛、足跟痛、踝關節腫痛。" },
  { id: "BL67", name: "至陰", py: "Zhìyīn", meridian: "足太陽膀胱經", view: "back", x: 160, y: 580, location: "足小趾外側，趾甲角旁0.1寸。", action: "通經活絡、矯正胎位。", indications: "頭痛、目痛、胎位不正。" },
  { id: "BL17", name: "膈俞", py: "Géshù", meridian: "足太陽膀胱經", view: "back", x: 186, y: 200, location: "第七胸椎棘突下，旁開1.5寸。", action: "理血和血、寬胸利膈。", indications: "貧血、嘔吐、呃逆、咳血、皮膚搔癢。" },
  { id: "BL20", name: "脾俞", py: "Píshù", meridian: "足太陽膀胱經", view: "back", x: 186, y: 228, location: "第十一胸椎棘突下，旁開1.5寸。", action: "健脾和胃、利濕升清。", indications: "腹脹、腹瀉、消化不良、水腫、倦怠。" },
  { id: "BL25", name: "大腸俞", py: "Dàchángshù", meridian: "足太陽膀胱經", view: "back", x: 186, y: 276, location: "第四腰椎棘突下，旁開1.5寸。", action: "理氣降逆、調和腸胃。", indications: "腹脹、腹瀉、便秘、腰痛。" },
  { id: "GV3", name: "腰陽關", py: "Yāoyángguān", meridian: "督脈", view: "back", x: 200, y: 276, location: "第四腰椎棘突下凹陷，後正中線上。", action: "溫腎壯陽、舒筋活絡。", indications: "腰骶痛、下肢痿痺、月經不調、遺精。" },
  { id: "BL57", name: "承山", py: "Chéngshān", meridian: "足太陽膀胱經", view: "back", x: 166, y: 470, location: "小腿後正中，腓腸肌兩肌腹之間凹陷的尖角處。", action: "舒筋活絡、理腸療痔。", indications: "小腿抽筋、腰背痛、痔瘡、便秘。" },
  { id: "GV12", name: "身柱", py: "Shēnzhù", meridian: "督脈", view: "back", x: 200, y: 172, location: "第三胸椎棘突下凹陷，後正中線上。", action: "宣肺清熱、寧神鎮咳。", indications: "咳嗽、氣喘、脊背強痛、小兒體弱。" },
  { id: "GV9", name: "至陽", py: "Zhìyáng", meridian: "督脈", view: "back", x: 200, y: 200, location: "第七胸椎棘突下凹陷，後正中線上。", action: "利膽退黃、寬胸利膈。", indications: "黃疸、胸脅脹痛、咳嗽、脊背強痛。" },
  { id: "BL11", name: "大杼", py: "Dàzhù", meridian: "足太陽膀胱經", view: "back", x: 185, y: 160, location: "第一胸椎棘突下，旁開1.5寸。", action: "強筋壯骨、祛風解表。", indications: "頸項強痛、肩背痛、咳嗽、發熱。" },
  { id: "BL15", name: "心俞", py: "Xīnshù", meridian: "足太陽膀胱經", view: "back", x: 186, y: 186, location: "第五胸椎棘突下，旁開1.5寸。", action: "寧心安神、寬胸理氣。", indications: "心悸、失眠、健忘、咳嗽、盜汗。" },
  { id: "BL18", name: "肝俞", py: "Gānshù", meridian: "足太陽膀胱經", view: "back", x: 186, y: 212, location: "第九胸椎棘突下，旁開1.5寸。", action: "疏肝利膽、養血明目。", indications: "脅痛、目疾、眩暈、情緒鬱悶、月經不調。" },
  { id: "BL19", name: "膽俞", py: "Dǎnshù", meridian: "足太陽膀胱經", view: "back", x: 186, y: 221, location: "第十胸椎棘突下，旁開1.5寸。", action: "疏肝利膽、清熱化濕。", indications: "黃疸、口苦、脅痛、胃脘脹痛。" },
  { id: "BL21", name: "胃俞", py: "Wèishù", meridian: "足太陽膀胱經", view: "back", x: 186, y: 242, location: "第十二胸椎棘突下，旁開1.5寸。", action: "和胃健脾、消食化滯。", indications: "胃痛、腹脹、嘔吐、消化不良。" },
  { id: "BL32", name: "次髎", py: "Cìliáo", meridian: "足太陽膀胱經", view: "back", x: 190, y: 300, location: "第二骶後孔中，約當髂後上棘與後正中線之間。", action: "補益下焦、調經止帶。", indications: "月經不調、痛經、帶下、腰骶痛、小便不利。" },
  { id: "BL36", name: "承扶", py: "Chéngfú", meridian: "足太陽膀胱經", view: "back", x: 172, y: 332, location: "臀橫紋中點。", action: "舒筋活絡、通便消痔。", indications: "腰骶臀股痛、坐骨神經痛、痔疾。" },
  { id: "BL37", name: "殷門", py: "Yīnmén", meridian: "足太陽膀胱經", view: "back", x: 171, y: 372, location: "承扶下六寸，大腿後正中。", action: "舒筋通絡、強腰健膝。", indications: "腰背痛、下肢痿痺、坐骨神經痛。" },
  { id: "BL62", name: "申脈", py: "Shēnmài", meridian: "足太陽膀胱經", view: "back", x: 174, y: 550, location: "外踝直下方凹陷處。", action: "舒筋活絡、寧心安神。", indications: "頭痛、眩暈、失眠、癲癇、踝關節痛。" },
];

export const SYMPTOM_GROUPS: SymptomGroup[] = [
  { id: "common-cold", name: "感冒", category: "外感類", description: "外感風寒或風熱所致，可見惡寒或發熱、頭痛、鼻塞、咳嗽等，依表現不同選方。",
    formulas: [
      { name: "桂枝湯", pattern: "發熱、惡風、自汗出、脈浮緩 — 太陽中風表虛證", composition: "桂枝、芍藥、生薑、大棗、炙甘草", usage: "水煎溫服，服後可飲熱粥助微汗，每日一劑。", notes: "表實無汗、高熱者不宜；服藥期間忌生冷油膩。" },
      { name: "葛根湯", pattern: "惡寒、項背強痛、無汗、脈浮緊 — 表證兼項背拘急", composition: "葛根、麻黃、桂枝、芍藥、生薑、大棗、炙甘草", usage: "水煎溫服，每日一劑，分二次服，得汗為度。", notes: "體虛多汗、高血壓患者慎用。" },
      { name: "麻黃湯", pattern: "惡寒重、發熱、無汗、頭痛身痛、脈浮緊 — 太陽傷寒表實證", composition: "麻黃、桂枝、杏仁、炙甘草", usage: "水煎溫服，得汗即止，不可過量發汗。", notes: "體虛、自汗、心臟病及孕婦忌用。" },
      { name: "銀翹散", pattern: "發熱重、咽喉腫痛、口乾、舌紅 — 風熱表證", composition: "金銀花、連翹、薄荷、牛蒡子、桔梗、淡竹葉、荊芥、甘草", usage: "水煎或沖泡代茶飲，每日一至二劑。", notes: "風寒無汗惡寒者不宜，脾胃虛寒慎用。" },
    ], points: ["GV14", "LI4", "GV20"] },

  { id: "cough", name: "咳嗽", category: "肺系類", description: "依痰之寒熱與多寡區分證型，咳嗽久暫、痰色痰量是辨證關鍵。",
    formulas: [
      { name: "杏蘇散", pattern: "咳嗽痰白、惡寒、鼻塞流清涕 — 風寒咳嗽", composition: "杏仁、紫蘇葉、半夏、茯苓、陳皮、前胡、桔梗、枳殼、生薑、甘草", usage: "水煎溫服，每日一劑。", notes: "陰虛燥咳、咳血者不宜。" },
      { name: "桑菊飲", pattern: "咳嗽痰少、咽乾、發熱、舌紅 — 風熱咳嗽", composition: "桑葉、菊花、杏仁、連翹、薄荷、桔梗、甘草、蘆根", usage: "水煎服，每日一至二劑。", notes: "風寒咳嗽（怕冷痰白）不宜。" },
      { name: "二陳湯", pattern: "咳嗽痰多色白、胸悶、喉中痰鳴 — 痰濕咳嗽", composition: "半夏、陳皮、茯苓、炙甘草、生薑", usage: "水煎溫服，每日一劑，分二次飯後服。", notes: "燥咳、陰虛火旺者不宜。" },
    ], points: ["CV17", "LU1", "LU7"] },

  { id: "insomnia", name: "失眠", category: "神志類", description: "失眠常與心、肝、脾相關，依伴隨症狀（陰虛火旺、肝血不足、心脾兩虛）選方。",
    formulas: [
      { name: "天王補心丹", pattern: "心悸、健忘、口乾、舌紅 — 陰虛火旺型失眠", composition: "生地、麥冬、天冬、酸棗仁、柏子仁、當歸、丹參、人參、五味子、遠志、茯苓、桔梗", usage: "蜜丸或科學中藥，每日二至三次，睡前服用。", notes: "脾胃虛寒、易腹瀉者慎用。" },
      { name: "酸棗仁湯", pattern: "虛煩不眠、心悸、易驚 — 肝血不足型失眠", composition: "酸棗仁、茯苓、知母、川芎、炙甘草", usage: "水煎服，睡前一至二小時溫服。", notes: "外感發熱期間不宜服用。" },
      { name: "歸脾湯", pattern: "失眠多夢、健忘、食慾不振、倦怠乏力 — 心脾兩虛", composition: "白朮、茯苓、黃耆、龍眼肉、酸棗仁、人參、木香、當歸、遠志、炙甘草、生薑、大棗", usage: "水煎溫服，每日一劑，分二次服。", notes: "實熱證、舌苔黃厚者不宜。" },
    ], points: ["HT7", "PC6", "GV20", "SP6"] },

  { id: "anxiety", name: "情緒煩躁／焦慮", category: "神志類", description: "情緒鬱結與肝氣不暢相關，輕者藥性平和方劑即可，較重者須疏肝理氣。",
    formulas: [
      { name: "甘麥大棗湯", pattern: "心神不寧、易哭、胸悶嘆氣 — 臟躁輕證", composition: "甘草、淮小麥、大棗", usage: "水煎代茶飲，每日一劑。", notes: "藥性平和，但症狀持續應就醫評估。" },
      { name: "逍遙散", pattern: "胸脅脹悶、易怒、經前症狀加重、嘆氣 — 肝鬱證", composition: "柴胡、白芍、當歸、白朮、茯苓、炙甘草、生薑、薄荷", usage: "水煎溫服或科學中藥沖服，每日一至二次。", notes: "陰虛血燥、潮熱明顯者慎用。" },
    ], points: ["LR3", "PC6", "GV20"] },

  { id: "indigestion", name: "胃脹消化不良", category: "脾胃類", description: "依虛實區分：脾胃氣虛者宜補益，食積氣滯者宜消導。",
    formulas: [
      { name: "香砂六君子湯", pattern: "食後腹脹、食慾不振、倦怠、大便稀軟 — 脾胃氣虛", composition: "黨參、白朮、茯苓、甘草、陳皮、半夏、木香、砂仁", usage: "水煎溫服，每日一劑，分二次飯前服。", notes: "實熱證（口臭、便秘、舌苔黃厚）不宜單用。" },
      { name: "保和丸", pattern: "噯腐吞酸、腹脹拒按、大便臭穢 — 食積證", composition: "山楂、神麴、半夏、茯苓、陳皮、連翹、萊菔子", usage: "成藥每次一份，每日二至三次，飯後服用。", notes: "脾胃虛弱無食積者不宜長期服用。" },
    ], points: ["ST36", "CV12"] },

  { id: "constipation", name: "便秘", category: "脾胃類", description: "腸燥便秘多見口乾、便硬；氣虛便秘多見年長體弱、便質不硬但排出無力。",
    formulas: [
      { name: "麻子仁丸", pattern: "大便乾結、數日一行、腹部脹滿、口乾 — 腸燥便秘", composition: "火麻仁、杏仁、芍藥、枳實、厚朴、大黃", usage: "成藥每次一至二丸，每日一至二次。", notes: "含大黃，孕婦、久瀉者忌用，不宜長期連續服用。" },
      { name: "補中益氣湯", pattern: "排便無力、便質不硬但難排出、神疲乏力 — 氣虛便秘", composition: "黃耆、人參、白朮、當歸、陳皮、升麻、柴胡、炙甘草、生薑、大棗", usage: "水煎溫服，每日一劑。", notes: "實熱便秘、舌紅苔黃者不宜。" },
    ], points: ["ST36", "CV12"] },

  { id: "dysmenorrhea", name: "月經不調／痛經", category: "婦科類", description: "依經色、經量與腹痛性質區分寒凝、血虛、血瘀等證型。",
    formulas: [
      { name: "溫經湯", pattern: "經色暗、量少、小腹冷痛、畏寒 — 寒凝胞宮", composition: "吳茱萸、當歸、川芎、芍藥、人參、桂枝、阿膠、牡丹皮、生薑、甘草、半夏、麥冬", usage: "經前一週開始水煎溫服，每日一劑。", notes: "經量過多、懷孕者禁用。" },
      { name: "四物湯", pattern: "經量少、色淡、頭暈乏力、面色蒼白 — 血虛證", composition: "當歸、川芎、芍藥、熟地黃", usage: "水煎溫服，月經結束後連服數日。", notes: "血瘀有塊、舌暗者宜配合活血藥。" },
      { name: "桃紅四物湯", pattern: "經色暗紫有血塊、小腹刺痛、舌暗 — 血瘀證", composition: "桃仁、紅花、當歸、川芎、芍藥、熟地黃", usage: "水煎溫服，經前數日開始服用。", notes: "經量過多、孕婦禁用。" },
    ], points: ["SP6", "CV4", "SP10"] },

  { id: "headache", name: "頭痛", category: "肝腎類", description: "外感誘發的頭痛與肝陽上亢型頭痛在誘因與伴隨症狀上不同，選方亦異。",
    formulas: [
      { name: "川芎茶調散", pattern: "頭痛因感冒誘發、鼻塞、惡風 — 外感頭痛", composition: "川芎、白芷、羌活、荊芥、防風、薄荷、細辛、甘草", usage: "以淡茶水沖服，頭痛發作時服用。", notes: "血虛、陰虛火旺型頭痛不宜，孕婦慎用。" },
      { name: "天麻鉤藤飲", pattern: "頭痛眩暈、急躁易怒、失眠、面紅 — 肝陽上亢", composition: "天麻、鉤藤、石決明、黃芩、山梔子、牛膝、杜仲、益母草、桑寄生、夜交藤、茯神", usage: "水煎溫服，每日一劑。", notes: "氣血兩虛、面色蒼白者不宜單用。" },
    ], points: ["GV20", "LI4", "LR3"] },

  { id: "lower-back-knee", name: "腰膝痠軟／疲勞", category: "肝腎類", description: "腎陰虛多兼潮熱口乾；腎陽虛多兼畏寒夜尿，兩者用方寒熱迥異。",
    formulas: [
      { name: "六味地黃丸", pattern: "腰膝痠軟、口乾、潮熱、夜尿多 — 腎陰虛", composition: "熟地黃、山藥、山茱萸、澤瀉、茯苓、牡丹皮", usage: "成藥每次一份，每日二至三次，溫水送服。", notes: "舌苔厚膩、腹瀉、感冒發熱期間不宜。" },
      { name: "金匱腎氣丸", pattern: "腰膝冷痛、畏寒、夜尿頻多、四肢不溫 — 腎陽虛", composition: "熟地黃、山藥、山茱萸、澤瀉、茯苓、牡丹皮、桂枝、附子", usage: "成藥每次一份，每日二至三次，溫水送服。", notes: "含附子，陰虛火旺、孕婦不宜，須遵醫囑。" },
    ], points: ["KI3", "ST36", "CV4", "GV4"] },

  { id: "edema", name: "水腫", category: "脾胃類", description: "水濕內停與氣虛水腫的差別在於是否伴隨自汗、怕風與身體沉重感。",
    formulas: [
      { name: "五苓散", pattern: "下肢浮腫、小便量少、口渴但不欲多飲 — 水濕內停", composition: "豬苓、茯苓、澤瀉、白朮、桂枝", usage: "沖服或水煎服，每日一至二劑，多飲溫水。", notes: "陰虛口乾、嚴重腎臟疾病須醫師評估。" },
      { name: "防己黃耆湯", pattern: "下肢浮腫、汗出怕風、身體沉重 — 氣虛水腫", composition: "防己、黃耆、白朮、甘草、生薑、大棗", usage: "水煎溫服，每日一劑。", notes: "表實無汗、高血壓控制不佳者慎用。" },
    ], points: ["SP6", "SP9", "ST36"] },
];
