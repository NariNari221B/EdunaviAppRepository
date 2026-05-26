import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000001";
const AUTHORS = [
  { id: "00000000-0000-0000-0000-000000000002", name: "鈴木 先生", role: "2学年主任" },
  { id: "00000000-0000-0000-0000-000000000003", name: "田中 先生", role: "養護教諭" },
  { id: "00000000-0000-0000-0000-000000000004", name: "高橋 先生", role: "生徒指導主事" }
];

const MOCK_TASKS = [
  {
    title: "新入生オリエンテーション準備",
    month: 4,
    description: "新1年生向けの学校生活オリエンテーションの資料作成と会場準備を行います。",
    tags: ["行事", "生徒指導"],
    steps: [
      "昨年度の配布資料データを共有フォルダから探す",
      "今年度の学年方針に合わせて内容を更新する",
      "印刷室で必要部数（約200部）を両面印刷・ホチキス留めする",
      "前日に体育館のパイプ椅子を並べる（バスケ部に手伝いをお願いする）"
    ]
  },
  {
    title: "1学期中間テスト作成",
    month: 5,
    description: "中間テストの作問と印刷手配を行います。",
    tags: ["成績処理", "校務"],
    steps: [
      "出題範囲を学年主任と確認する",
      "過去問題と重複しないように問題案を作成する",
      "教務主任に問題用紙のチェックを依頼する",
      "テストの3日前までに金庫室の印刷機で印刷し、厳重に保管する"
    ]
  },
  {
    title: "修学旅行のしおり作成",
    month: 9,
    description: "2年生の修学旅行（京都・奈良）に向けた生徒用しおりの作成と配布を行います。",
    tags: ["行事"],
    steps: [
      "旅行会社から行程表の最新データをもらう",
      "持ち物リストを昨年のものから見直し、不要なものを削除する",
      "表紙絵を美術部に依頼する（〆切は8月末）",
      "しおりの読み合わせ学年集会を企画する"
    ]
  },
  {
    title: "通知表（1学期）の所見入力",
    month: 7,
    description: "1学期末の通知表（あゆみ）における、生活面・学習面の所見を入力します。",
    tags: ["成績処理", "提出書類"],
    steps: [
      "校務支援システムにログインし、所見入力画面を開く",
      "期日（終業式の1週間前）までに全員分の入力を終える",
      "教頭先生のチェックを受ける",
      "修正があれば直し、最終承認を得る"
    ]
  },
  {
    title: "教員用タブレットの年度更新",
    month: 3,
    description: "次年度に向けた教員用iPadのOSアップデートと不要アプリの整理を行います。",
    tags: ["ICT", "校務"],
    steps: [
      "教育委員会からのマニュアルを確認する",
      "端末を一斉回収し、充電保管庫にセットする",
      "MDM（モバイルデバイス管理）から一括アップデート指示を出す",
      "各端末が正常に起動するか1台ずつ確認する"
    ]
  }
];

const MOCK_TIPS = [
  {
    taskTitle: "修学旅行のしおり作成",
    authorName: "鈴木 先生",
    content: "旅行会社の行程表は直前に5分単位で変わることがあります。しおりの行程ページは一番最後に印刷したほうが無難です。",
  },
  {
    taskTitle: "修学旅行のしおり作成",
    authorName: "田中 先生",
    content: "持ち物リストに「常備薬（酔い止め等）」を必ず入れるように強調してください。現地で買う時間が取れないことが多いです。",
  },
  {
    taskTitle: "新入生オリエンテーション準備",
    authorName: "高橋 先生",
    content: "パイプ椅子並べはバスケ部だけでなく、バレー部とローテーションで頼むと不公平感が出なくて良いです。",
  }
];

async function seed() {
  console.log("Seeding Database...");

  try {
    // 1. ユーザーの挿入 (Authを介さない)
    console.log("Upserting dummy users...");
    await supabase.from('users').upsert({
      id: DUMMY_USER_ID,
      name: "佐藤 太郎",
      role: "1学年主任",
    });

    for (const a of AUTHORS) {
      await supabase.from('users').upsert({
        id: a.id,
        name: a.name,
        role: a.role,
      });
    }

    // 2. Tasks の挿入
    console.log("Clearing existing tasks...");
    await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // 全削除

    console.log("Inserting tasks...");
    const taskIdMap: Record<string, string> = {};
    
    for (const task of MOCK_TASKS) {
      const { data, error } = await supabase.from('tasks').insert({
        title: task.title,
        month: task.month,
        description: task.description,
        tags: task.tags,
        steps: task.steps,
        author_id: DUMMY_USER_ID,
      }).select().single();

      if (error) {
        console.error("Error inserting task:", task.title, error);
        continue;
      }
      taskIdMap[task.title] = data.id;
    }

    // 3. Tips の挿入
    console.log("Inserting tips...");
    for (const tip of MOCK_TIPS) {
      const tId = taskIdMap[tip.taskTitle];
      const author = AUTHORS.find(a => a.name === tip.authorName);
      const aId = author ? author.id : DUMMY_USER_ID;

      if (tId && aId) {
        const { error } = await supabase.from('tips').insert({
          task_id: tId,
          author_id: aId,
          content: tip.content
        });
        if (error) {
          console.error("Error inserting tip:", tip, error);
        }
      }
    }

    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Seed error:", err);
  }
}

seed();
