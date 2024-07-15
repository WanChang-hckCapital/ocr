const chineseSurnames = "(?:Chong|Huang|Lee|Li|Chen|Wong|Lin|Zhang|Wang|Liu|Tan|Yang|Zhao|Xu|Sun|Ma|Feng|张|李|王|刘|陈|杨|赵|黄|周|吴|徐|孙|胡|朱|高|林|何|郭|马|罗|梁|宋|邓|冯|谢|韩|曾|吕|沈|姚|卢|姜|崔|钟|潘|龚|金|薛|翟|韩|范|贾|云|柴|欧阳|卓)";
const englishFirstNames = "(?:James|John|Robert|Michael|William|David|Richard|Joseph|Charles|Thomas|Christopher|Daniel|Matthew|Anthony|Donald|Mark|Paul|Steven|Andrew|Kenneth|George|Joshua|Kevin|Brian|Edward|Ronald|Timothy|Jason|Jeffrey|Ryan|Jacob|Gary|Nicholas|Eric|Jonathan|Stephen|Larry|Justin|Scott|Brandon|Benjamin|Samuel|Gregory|Frank|Alexander|Raymond|Patrick|Jack|Dennis|Jerry|Tyler|Aaron|Jose|Henry|Adam|Douglas|Nathan|Peter|Zachary|Kyle|Walter|Harold|Jeremy|Ethan|Carl|Keith|Roger|Gerald|Christian|Terry|Sean|Arthur|Austin|Noah|Jesse|Joe|Bryan|Billy|Jordan|Albert|Dylan|Bruce|Willie|Gabriel|Alan|Juan|Logan|Wayne|Ralph|Roy|Eugene|Randy|Vincent|Russell|Louis|Philip|Bobby|Johnny|Bradley)";

export const namePatterns = [
  new RegExp(`\\b(?:Mr|Ms|Dr|Mrs|Miss|Prof)?\\s*${chineseSurnames}\\s+[A-Z][a-z]+\\b`),
  new RegExp(`\\b(?:Mr|Ms|Dr|Mrs|Miss|Prof)?\\s*${chineseSurnames}\\s+[A-Z][a-z]+\\s+[A-Z][a-z]+\\b`),
  new RegExp(`\\b(?:Mr|Ms|Dr|Mrs|Miss|Prof)?\\s*${chineseSurnames}(?:文|杰|明|丽|强|军|勇|燕|磊|娜|芳|伟|俊|建|霞|宇|鹏|洁|娟|红|飞|敏|亮|文杰|文傑|明霞|明杰|建国|建國|建杰|麗|强|軍|勇|燕|磊|娜|芳|偉|俊|建|霞|宇|鵬|潔|娟|紅|飛|敏|亮|沁璇)\\b`),
  new RegExp(`\\b(?:Mr|Ms|Dr|Mrs|Miss|Prof)?\\s*${englishFirstNames}\\s+[A-Z][a-z]+\\b`),
  new RegExp(`\\b(?:Mr|Ms|Dr|Mrs|Miss|Prof)?\\s*${englishFirstNames}\\s+[A-Z][a-z]+\\s+[A-Z][a-z]+\\b`),

  /\b(?:Mr|Ms|Dr|Mrs|Miss|Prof)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/,
];

export const jobTitlePatterns = [
    /\b(?:Senior|Junior|Lead|Chief|Head|Manager|Engineer|Developer|Consultant|Director|Officer|Designer|Financial Advisor|Architect|Analyst|Specialist|Coordinator|Administrator|Technician|Executive)\b(?:\s+[A-Za-z]+){0,3}/i,
    /\b(?:CEO|CFO|CTO|COO|CIO|CMO|CISO|CSO|VP|SVP|AVP|EVP|President|Principal|Partner|Founder|Co-Founder)\b/i,
    /\b(?:软件工程师|軟體工程師|策划师|策劃師|工程师|工程師|开发工程师|開發工程師|高级工程师|高級工程師|项目经理|項目經理|产品经理|產品經理|设计师|設計師|架构师|架構師|分析师|分析師|顾问|顧問|主任|主管|专员|專員|经理|經理|主任|總監|總經理|副總裁|總裁|總經理)\b/,
];

export const phonePattern = /\+?\d[\d\s-]{7,}/;

export const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;

export const addressPattern = /(\d{1,5}\s\w+\s\w+.*,\s\w+\s\w+)/;

export const websitePattern = /(https?:\/\/[^\s]+)/i;
