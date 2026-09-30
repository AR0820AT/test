import type { WordPos } from '@/types'

export type WordEntry = { word: string; pos: WordPos }

/**
 * 英文高频词 500 个：单词|词性
 * 词性只用于「拼卡成句」时挑选模板，不会展示给用户
 * pos：noun 名词 / verb 动词 / adj 形容词 / adv 副词 / pron 代词 / det 限定词
 *      prep 介词 / conj 连词 / aux 情态或助动词 / num 数词
 */
const RAW = `
the|det
be|verb
to|prep
of|prep
and|conj
a|det
in|prep
that|det
have|verb
I|pron
it|pron
for|prep
not|adv
on|prep
with|prep
he|pron
as|conj
you|pron
do|verb
at|prep
this|det
but|conj
his|det
by|prep
from|prep
they|pron
we|pron
say|verb
her|det
she|pron
or|conj
an|det
will|aux
my|det
one|num
all|det
would|aux
there|adv
their|det
what|pron
so|adv
up|adv
out|adv
if|conj
about|prep
who|pron
get|verb
which|pron
go|verb
me|pron
when|adv
make|verb
can|aux
like|verb
time|noun
no|det
just|adv
him|pron
know|verb
take|verb
people|noun
into|prep
year|noun
your|det
good|adj
some|det
could|aux
them|pron
see|verb
other|adj
than|conj
then|adv
now|adv
look|verb
only|adv
come|verb
its|det
over|prep
think|verb
also|adv
back|adv
after|prep
use|verb
two|num
how|adv
our|det
work|verb
first|adj
well|adv
way|noun
even|adv
new|adj
want|verb
because|conj
any|det
these|det
give|verb
day|noun
most|adv
us|pron
very|adv
never|adv
always|adv
often|adv
here|adv
man|noun
find|verb
thing|noun
tell|verb
try|verb
ask|verb
need|verb
feel|verb
become|verb
leave|verb
put|verb
mean|verb
keep|verb
let|verb
begin|verb
seem|verb
help|verb
talk|verb
turn|verb
start|verb
might|aux
show|verb
hear|verb
play|verb
run|verb
move|verb
live|verb
believe|verb
hold|verb
bring|verb
happen|verb
write|verb
sit|verb
stand|verb
lose|verb
pay|verb
meet|verb
include|verb
continue|verb
set|verb
learn|verb
change|verb
lead|verb
understand|verb
watch|verb
follow|verb
stop|verb
create|verb
speak|verb
read|verb
allow|verb
add|verb
spend|verb
grow|verb
open|verb
walk|verb
win|verb
offer|verb
remember|verb
love|verb
consider|verb
appear|verb
buy|verb
wait|verb
serve|verb
die|verb
send|verb
expect|verb
build|verb
stay|verb
fall|verb
cut|verb
reach|verb
kill|verb
remain|verb
suggest|verb
raise|verb
pass|verb
sell|verb
require|verb
report|verb
decide|verb
pull|verb
return|verb
explain|verb
hope|verb
develop|verb
carry|verb
break|verb
receive|verb
agree|verb
support|verb
hit|verb
produce|verb
eat|verb
cover|verb
catch|verb
choose|verb
world|noun
life|noun
hand|noun
part|noun
eye|noun
place|noun
week|noun
case|noun
point|noun
company|noun
number|noun
group|noun
problem|noun
fact|noun
home|noun
water|noun
room|noun
mother|noun
area|noun
money|noun
story|noun
month|noun
right|noun
study|noun
book|noun
job|noun
word|noun
business|noun
issue|noun
side|noun
kind|noun
head|noun
house|noun
service|noun
friend|noun
father|noun
power|noun
hour|noun
game|noun
line|noun
end|noun
member|noun
law|noun
car|noun
city|noun
name|noun
team|noun
minute|noun
idea|noun
body|noun
information|noun
parent|noun
face|noun
level|noun
office|noun
door|noun
health|noun
person|noun
art|noun
war|noun
history|noun
party|noun
result|noun
morning|noun
reason|noun
girl|noun
moment|noun
air|noun
teacher|noun
force|noun
food|noun
market|noun
price|noun
music|noun
night|noun
age|noun
school|noun
system|noun
program|noun
question|noun
government|noun
child|noun
woman|noun
family|noun
student|noun
society|noun
country|noun
community|noun
state|noun
paper|noun
space|noun
ground|noun
form|noun
matter|noun
center|noun
couple|noun
activity|noun
industry|noun
media|noun
phone|noun
picture|noun
great|adj
big|adj
old|adj
different|adj
small|adj
large|adj
young|adj
important|adj
few|adj
public|adj
bad|adj
same|adj
able|adj
human|adj
local|adj
late|adj
hard|adj
major|adj
better|adj
strong|adj
possible|adj
whole|adj
free|adj
true|adj
full|adj
special|adj
easy|adj
clear|adj
recent|adj
certain|adj
personal|adj
ready|adj
real|adj
beautiful|adj
sorry|adj
wrong|adj
dead|adj
fine|adj
heavy|adj
hot|adj
poor|adj
safe|adj
sure|adj
tired|adj
warm|adj
cold|adj
dark|adj
deep|adj
fast|adj
high|adj
long|adj
low|adj
quiet|adj
rich|adj
slow|adj
soft|adj
wide|adj
happy|adj
sad|adj
angry|adj
busy|adj
clean|adj
close|adj
common|adj
complete|adj
correct|adj
crazy|adj
difficult|adj
early|adj
empty|adj
expensive|adj
famous|adj
favorite|adj
final|adj
foreign|adj
fresh|adj
funny|adj
general|adj
glad|adj
huge|adj
ill|adj
little|adj
lucky|adj
mad|adj
main|adj
modern|adj
nervous|adj
nice|adj
normal|adj
past|adj
perfect|adj
pleasant|adj
polite|adj
popular|adj
proud|adj
quick|adj
rare|adj
again|adv
away|adv
down|adv
far|adv
forward|adv
instead|adv
later|adv
less|adv
maybe|adv
near|adv
quite|adv
really|adv
soon|adv
still|adv
today|adv
tomorrow|adv
tonight|adv
together|adv
yesterday|adv
yet|adv
where|adv
why|adv
once|adv
perhaps|adv
almost|adv
already|adv
enough|adv
especially|adv
finally|adv
hardly|adv
immediately|adv
nearly|adv
probably|adv
slowly|adv
suddenly|adv
usually|adv
between|prep
through|prep
during|prep
before|prep
above|prep
since|prep
without|prep
within|prep
along|prep
across|prep
behind|prep
beyond|prep
around|prep
against|prep
among|prep
until|conj
unless|conj
whether|conj
although|conj
though|conj
while|conj
shall|aux
should|aux
may|aux
must|aux
three|num
four|num
five|num
six|num
seven|num
eight|num
nine|num
ten|num
hundred|num
thousand|num
million|num
second|num
third|num
half|num
many|num
much|num
more|num
several|num
both|num
least|num
mine|pron
yours|pron
whose|pron
someone|pron
everyone|pron
something|pron
anything|pron
nothing|pron
myself|pron
each|det
every|det
those|det
another|det
such|det
last|adj
next|adj
own|adj
usual|adj
`

/** 500 个高频词，按常用度排序 */
export const TOP_WORDS: WordEntry[] = RAW.trim()
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [word, pos] = line.split('|')
    return { word, pos: (pos || 'noun') as WordPos }
  })

/** 常用英文口语句子，作为「英文 / 句子」字卡 */
export const EN_SENTENCES: string[] = [
  'What are you up to?',
  'Just thinking about you.',
  'Did you eat yet?',
  "Long day, but I'm okay.",
  "I'll be right here.",
  'Tell me about your day.',
  'That sounds nice.',
  'Take your time.',
  'I miss you a little.',
  'Guess what happened today.',
  'You always make me laugh.',
  'Let us talk later tonight.',
  'I just got home.',
  "No rush, I'll wait.",
  "It's been a long week.",
  'Thanks for being here.',
  "I can't stop smiling.",
  'Good night, sleep well.',
  'Morning, did you sleep well?',
  "I'm still awake, honestly.",
  'Send me a picture?',
  "Everything's fine on my side.",
  'Coffee first, then talk.',
  'You were right, by the way.',
  "I'd rather stay in today.",
  'Nothing much, just resting.',
  'Call me when you are free.',
  'That made my day.',
  'Same here, honestly.',
  'See you soon, okay?',
]

/**
 * 中文常用字与词，作为「中文 / 词语」字卡
 * 单字（你、我、的、了…）和高频双音节词都收进来，按「人称 → 虚词 → 动词 → 时间
 * → 生活 → 情绪 → 称呼 → 事物 → 身体」大致分组，方便以后增删
 */
export const ZH_WORDS: string[] = [
  // 人称
  '你', '我', '他', '她', '它', '们',
  '我们', '你们', '他们', '自己', '大家', '别人',
  // 虚词、程度
  '的', '了', '是', '不', '没', '在', '有', '和', '跟', '就', '都', '也',
  '还', '再', '又', '才', '更', '最', '很', '太', '真', '要', '会', '能',
  '可以', '什么', '怎么', '为什么', '因为', '所以', '但是', '然后', '如果', '而且',
  // 动词
  '说', '问', '看', '听', '想', '来', '去', '吃', '喝', '睡', '走', '坐',
  '站', '拿', '放', '找', '等', '给', '回', '开', '关', '做', '用', '洗',
  '穿', '爱', '哭', '笑',
  '知道', '明白', '告诉', '聊天', '见面', '想念', '记得', '忘记', '陪伴', '等待',
  '拥抱', '喜欢',
  // 时间
  '现在', '以前', '以后', '刚才', '马上', '已经', '终于', '忽然', '常常', '总是',
  '一直', '今天', '明天', '昨天', '早上', '中午', '晚上', '半夜', '周末', '时间',
  '时候', '小时', '分钟', '日子', '年', '月', '日', '天', '早', '晚',
  // 生活
  '生活', '工作', '学习', '休息', '睡觉', '起床', '吃饭', '喝水', '洗澡', '上班',
  '下班', '回家', '出门', '走路', '旅行', '电影', '音乐', '小说', '画画', '唱歌',
  '游戏', '手机', '电脑', '消息', '电话', '照片', '视频', '朋友', '家人', '父母',
  '孩子', '老师', '同学', '同事', '家里',
  // 情绪与状态
  '开心', '难过', '生气', '害怕', '担心', '紧张', '放松', '舒服', '累了', '忙',
  '饿', '冷', '热', '痛', '病', '心情', '感觉', '记忆', '梦想', '希望',
  '幸福', '快乐', '健康', '平安', '顺利', '麻烦',
  // 称呼与亲昵
  '早安', '晚安', '你好', '谢谢', '再见', '对不起', '没关系', '加油', '想你', '抱抱',
  '好梦', '乖', '听话', '小心', '别怕', '慢慢', '一起', '永远', '特别', '温柔',
  '可爱', '傻瓜', '笨蛋', '乖乖', '亲爱的', '没事', '好的', '真的',
  // 事物与自然
  '事情', '问题', '答案', '原因', '结果', '地方', '世界', '城市', '房间', '窗户',
  '厨房', '沙发', '灯光', '阳光', '月光', '星星', '天空', '大海', '森林', '树叶',
  '香味', '味道', '颜色', '声音', '温度', '天气', '下雨', '下雪', '微风', '花',
  '草', '树', '云', '光', '水', '火', '山', '风', '雨', '雪',
  '夜', '梦', '星', '春', '夏', '秋', '冬',
  // 身体、方位、数量
  '心', '人', '手', '眼', '口', '头', '脸', '身', '家', '门', '路', '话',
  '书', '字', '名', '事', '猫', '狗', '鸟', '鱼', '茶', '饭', '糖', '声',
  '音', '白', '黑', '红', '大', '小', '多', '少', '好', '新', '老', '上',
  '下', '里', '外', '前', '后', '一', '二', '三', '十', '百', '千', '万',
]

/**
 * 中文句子：只留「早点睡」「想你」这种短句，长句一律不要
 * 都以标点结尾，这样自动分组会归到「中文 / 句子」而不是「词语」
 */
export const ZH_SENTENCES: string[] = [
  '早点睡。',
  '想你了。',
  '别熬夜。',
  '好好吃饭。',
  '记得喝水。',
  '我在等你。',
  '到家了吗？',
  '路上小心。',
  '晚安好梦。',
  '明天见啦。',
  '别太累了。',
  '慢慢来，不急。',
  '我马上到。',
  '我在呢。',
  '想抱抱你。',
  '一起吃饭吧。',
  '今天开心吗？',
  '注意身体。',
  '早点回家。',
  '先去洗澡了。',
  '我睡啦，晚安。',
  '你先忙。',
  '梦见你了。',
  '早安呀。',
  '说好了哦。',
  '不许熬夜。',
]
