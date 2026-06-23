package com.medicine.api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicine.api.model.SymptomGroupEntity;
import com.medicine.api.repository.SymptomGroupRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds the symptom_groups table with the canonical TCM data on first startup.
 * Skipped if the table already has rows.
 */
@Component
public class SymptomGroupSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SymptomGroupSeeder.class);
    private final SymptomGroupRepository repository;
    private final ObjectMapper mapper = new ObjectMapper();

    public SymptomGroupSeeder(SymptomGroupRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) return;
        log.info("Seeding symptom_groups table…");
        repository.saveAll(buildSeedData());
        log.info("Seeded {} symptom groups.", repository.count());
    }

    private List<SymptomGroupEntity> buildSeedData() {
        return List.of(
            make(1, "感冒", "外感類",
                "外感風寒或風熱所致，可見惡寒或發熱、頭痛、鼻塞、咳嗽等，依表現不同選方。",
                """
                [
                  {"name":"桂枝湯","pattern":"發熱、惡風、自汗出、脈浮緩 — 太陽中風表虛證","composition":"桂枝、芍藥、生薑、大棗、炙甘草","usage":"水煎溫服，服後可飲熱粥助微汗，每日一劑。","notes":"表實無汗、高熱者不宜；服藥期間忌生冷油膩。"},
                  {"name":"葛根湯","pattern":"惡寒、項背強痛、無汗、脈浮緊 — 表證兼項背拘急","composition":"葛根、麻黃、桂枝、芍藥、生薑、大棗、炙甘草","usage":"水煎溫服，每日一劑，分二次服，得汗為度。","notes":"體虛多汗、高血壓患者慎用。"},
                  {"name":"麻黃湯","pattern":"惡寒重、發熱、無汗、頭痛身痛、脈浮緊 — 太陽傷寒表實證","composition":"麻黃、桂枝、杏仁、炙甘草","usage":"水煎溫服，得汗即止，不可過量發汗。","notes":"體虛、自汗、心臟病及孕婦忌用。"},
                  {"name":"銀翹散","pattern":"發熱重、咽喉腫痛、口乾、舌紅 — 風熱表證","composition":"金銀花、連翹、薄荷、牛蒡子、桔梗、淡竹葉、荊芥、甘草","usage":"水煎或沖泡代茶飲，每日一至二劑。","notes":"風寒無汗惡寒者不宜，脾胃虛寒慎用。"}
                ]
                """,
                """["GV14","LI4","GV20"]"""),

            make(2, "咳嗽", "肺系類",
                "依痰之寒熱與多寡區分證型，咳嗽久暫、痰色痰量是辨證關鍵。",
                """
                [
                  {"name":"杏蘇散","pattern":"咳嗽痰白、惡寒、鼻塞流清涕 — 風寒咳嗽","composition":"杏仁、紫蘇葉、半夏、茯苓、陳皮、前胡、桔梗、枳殼、生薑、甘草","usage":"水煎溫服，每日一劑。","notes":"陰虛燥咳、咳血者不宜。"},
                  {"name":"桑菊飲","pattern":"咳嗽痰少、咽乾、發熱、舌紅 — 風熱咳嗽","composition":"桑葉、菊花、杏仁、連翹、薄荷、桔梗、甘草、蘆根","usage":"水煎服，每日一至二劑。","notes":"風寒咳嗽（怕冷痰白）不宜。"},
                  {"name":"二陳湯","pattern":"咳嗽痰多色白、胸悶、喉中痰鳴 — 痰濕咳嗽","composition":"半夏、陳皮、茯苓、炙甘草、生薑","usage":"水煎溫服，每日一劑，分二次飯後服。","notes":"燥咳、陰虛火旺者不宜。"}
                ]
                """,
                """["CV17","LU1","LU7"]"""),

            make(3, "失眠", "神志類",
                "失眠常與心、肝、脾相關，依伴隨症狀（陰虛火旺、肝血不足、心脾兩虛）選方。",
                """
                [
                  {"name":"天王補心丹","pattern":"心悸、健忘、口乾、舌紅 — 陰虛火旺型失眠","composition":"生地、麥冬、天冬、酸棗仁、柏子仁、當歸、丹參、人參、五味子、遠志、茯苓、桔梗","usage":"蜜丸或科學中藥，每日二至三次，睡前服用。","notes":"脾胃虛寒、易腹瀉者慎用。"},
                  {"name":"酸棗仁湯","pattern":"虛煩不眠、心悸、易驚 — 肝血不足型失眠","composition":"酸棗仁、茯苓、知母、川芎、炙甘草","usage":"水煎服，睡前一至二小時溫服。","notes":"外感發熱期間不宜服用。"},
                  {"name":"歸脾湯","pattern":"失眠多夢、健忘、食慾不振、倦怠乏力 — 心脾兩虛","composition":"白朮、茯苓、黃耆、龍眼肉、酸棗仁、人參、木香、當歸、遠志、炙甘草、生薑、大棗","usage":"水煎溫服，每日一劑，分二次服。","notes":"實熱證、舌苔黃厚者不宜。"}
                ]
                """,
                """["HT7","PC6","GV20","SP6"]"""),

            make(4, "情緒煩躁／焦慮", "神志類",
                "情緒鬱結與肝氣不暢相關，輕者藥性平和方劑即可，較重者須疏肝理氣。",
                """
                [
                  {"name":"甘麥大棗湯","pattern":"心神不寧、易哭、胸悶嘆氣 — 臟躁輕證","composition":"甘草、淮小麥、大棗","usage":"水煎代茶飲，每日一劑。","notes":"藥性平和，但症狀持續應就醫評估。"},
                  {"name":"逍遙散","pattern":"胸脅脹悶、易怒、經前症狀加重、嘆氣 — 肝鬱證","composition":"柴胡、白芍、當歸、白朮、茯苓、炙甘草、生薑、薄荷","usage":"水煎溫服或科學中藥沖服，每日一至二次。","notes":"陰虛血燥、潮熱明顯者慎用。"}
                ]
                """,
                """["LR3","PC6","GV20"]"""),

            make(5, "胃脹消化不良", "脾胃類",
                "依虛實區分：脾胃氣虛者宜補益，食積氣滯者宜消導。",
                """
                [
                  {"name":"香砂六君子湯","pattern":"食後腹脹、食慾不振、倦怠、大便稀軟 — 脾胃氣虛","composition":"黨參、白朮、茯苓、甘草、陳皮、半夏、木香、砂仁","usage":"水煎溫服，每日一劑，分二次飯前服。","notes":"實熱證（口臭、便秘、舌苔黃厚）不宜單用。"},
                  {"name":"保和丸","pattern":"噯腐吞酸、腹脹拒按、大便臭穢 — 食積證","composition":"山楂、神麴、半夏、茯苓、陳皮、連翹、萊菔子","usage":"成藥每次一份，每日二至三次，飯後服用。","notes":"脾胃虛弱無食積者不宜長期服用。"}
                ]
                """,
                """["ST36","CV12"]"""),

            make(6, "便秘", "脾胃類",
                "腸燥便秘多見口乾、便硬；氣虛便秘多見年長體弱、便質不硬但排出無力。",
                """
                [
                  {"name":"麻子仁丸","pattern":"大便乾結、數日一行、腹部脹滿、口乾 — 腸燥便秘","composition":"火麻仁、杏仁、芍藥、枳實、厚朴、大黃","usage":"成藥每次一至二丸，每日一至二次。","notes":"含大黃，孕婦、久瀉者忌用，不宜長期連續服用。"},
                  {"name":"補中益氣湯","pattern":"排便無力、便質不硬但難排出、神疲乏力 — 氣虛便秘","composition":"黃耆、人參、白朮、當歸、陳皮、升麻、柴胡、炙甘草、生薑、大棗","usage":"水煎溫服，每日一劑。","notes":"實熱便秘、舌紅苔黃者不宜。"}
                ]
                """,
                """["ST36","CV12"]"""),

            make(7, "月經不調／痛經", "婦科類",
                "依經色、經量與腹痛性質區分寒凝、血虛、血瘀等證型。",
                """
                [
                  {"name":"溫經湯","pattern":"經色暗、量少、小腹冷痛、畏寒 — 寒凝胞宮","composition":"吳茱萸、當歸、川芎、芍藥、人參、桂枝、阿膠、牡丹皮、生薑、甘草、半夏、麥冬","usage":"經前一週開始水煎溫服，每日一劑。","notes":"經量過多、懷孕者禁用。"},
                  {"name":"四物湯","pattern":"經量少、色淡、頭暈乏力、面色蒼白 — 血虛證","composition":"當歸、川芎、芍藥、熟地黃","usage":"水煎溫服，月經結束後連服數日。","notes":"血瘀有塊、舌暗者宜配合活血藥。"},
                  {"name":"桃紅四物湯","pattern":"經色暗紫有血塊、小腹刺痛、舌暗 — 血瘀證","composition":"桃仁、紅花、當歸、川芎、芍藥、熟地黃","usage":"水煎溫服，經前數日開始服用。","notes":"經量過多、孕婦禁用。"}
                ]
                """,
                """["SP6","CV4","SP10"]"""),

            make(8, "頭痛", "肝腎類",
                "外感誘發的頭痛與肝陽上亢型頭痛在誘因與伴隨症狀上不同，選方亦異。",
                """
                [
                  {"name":"川芎茶調散","pattern":"頭痛因感冒誘發、鼻塞、惡風 — 外感頭痛","composition":"川芎、白芷、羌活、荊芥、防風、薄荷、細辛、甘草","usage":"以淡茶水沖服，頭痛發作時服用。","notes":"血虛、陰虛火旺型頭痛不宜，孕婦慎用。"},
                  {"name":"天麻鉤藤飲","pattern":"頭痛眩暈、急躁易怒、失眠、面紅 — 肝陽上亢","composition":"天麻、鉤藤、石決明、黃芩、山梔子、牛膝、杜仲、益母草、桑寄生、夜交藤、茯神","usage":"水煎溫服，每日一劑。","notes":"氣血兩虛、面色蒼白者不宜單用。"}
                ]
                """,
                """["GV20","LI4","LR3"]"""),

            make(9, "腰膝痠軟／疲勞", "肝腎類",
                "腎陰虛多兼潮熱口乾；腎陽虛多兼畏寒夜尿，兩者用方寒熱迥異。",
                """
                [
                  {"name":"六味地黃丸","pattern":"腰膝痠軟、口乾、潮熱、夜尿多 — 腎陰虛","composition":"熟地黃、山藥、山茱萸、澤瀉、茯苓、牡丹皮","usage":"成藥每次一份，每日二至三次，溫水送服。","notes":"舌苔厚膩、腹瀉、感冒發熱期間不宜。"},
                  {"name":"金匱腎氣丸","pattern":"腰膝冷痛、畏寒、夜尿頻多、四肢不溫 — 腎陽虛","composition":"熟地黃、山藥、山茱萸、澤瀉、茯苓、牡丹皮、桂枝、附子","usage":"成藥每次一份，每日二至三次，溫水送服。","notes":"含附子，陰虛火旺、孕婦不宜，須遵醫囑。"}
                ]
                """,
                """["KI3","ST36","CV4","GV4"]"""),

            make(10, "水腫", "脾胃類",
                "水濕內停與氣虛水腫的差別在於是否伴隨自汗、怕風與身體沉重感。",
                """
                [
                  {"name":"五苓散","pattern":"下肢浮腫、小便量少、口渴但不欲多飲 — 水濕內停","composition":"豬苓、茯苓、澤瀉、白朮、桂枝","usage":"沖服或水煎服，每日一至二劑，多飲溫水。","notes":"陰虛口乾、嚴重腎臟疾病須醫師評估。"},
                  {"name":"防己黃耆湯","pattern":"下肢浮腫、汗出怕風、身體沉重 — 氣虛水腫","composition":"防己、黃耆、白朮、甘草、生薑、大棗","usage":"水煎溫服，每日一劑。","notes":"表實無汗、高血壓控制不佳者慎用。"}
                ]
                """,
                """["SP6","SP9","ST36"]""")
        );
    }

    private SymptomGroupEntity make(int order, String name, String category,
                                    String description, String formulas, String points) {
        SymptomGroupEntity e = new SymptomGroupEntity();
        e.setSortOrder(order);
        e.setName(name);
        e.setCategory(category);
        e.setDescription(description);
        e.setFormulas(formulas.strip());
        e.setPoints(points);
        return e;
    }
}
