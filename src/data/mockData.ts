export type Tag = '校務' | '行事' | 'ICT' | '提出書類' | '生徒指導' | '成績処理';

export type Tip = {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
  likes: number;
};

export type Attachment = {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'word' | 'excel';
  url: string;
};

export type Task = {
  id: string;
  title: string;
  month: number;
  tags: Tag[];
  description: string;
  steps: string[];
  tips: Tip[];
  attachments?: Attachment[];
};

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: '新入生歓迎会の準備',
    month: 4,
    tags: ['行事', '校務'],
    description: '新入生を迎えるための歓迎会の企画・運営準備を行います。生徒会との連携が必須です。',
    steps: [
      '生徒会役員とのキックオフミーティング（開催1ヶ月前）',
      'プログラムの策定と教員への周知',
      '体育館の会場設営と音響チェック',
      '当日の進行管理'
    ],
    tips: [
      {
        id: 'tip1',
        author: '佐藤先生',
        role: '前年度 生徒会顧問',
        content: '※音響機材のBluetooth接続が途切れることがあるので、BGMは必ず有線接続のPCから流すようにしてください！',
        createdAt: '2025-03-10',
        likes: 5
      },
      {
        id: 'tip2',
        author: '鈴木先生',
        role: '1学年主任',
        content: '※プログラム表はサーバーの `共有/行事/04_新入生歓迎会/2025年度` に昨年のフォーマットがあります。',
        createdAt: '2025-03-15',
        likes: 12
      }
    ],
    attachments: [
      {
        id: 'a1',
        fileName: '新入生歓迎会_進行マニュアル.pdf',
        fileType: 'pdf',
        url: '#'
      },
      {
        id: 'a2',
        fileName: '歓迎会_座席表.excel',
        fileType: 'excel',
        url: '#'
      }
    ]
  },
  {
    id: 't2',
    title: '1学期 中間テスト問題作成',
    month: 5,
    tags: ['成績処理', '校務'],
    description: '中間テストの試験問題作成と印刷依頼を行います。',
    steps: [
      '各教科担当での出題範囲のすり合わせ',
      'テスト問題・解答用紙の作成（Word/Excel）',
      '教務部へのテスト原稿提出（試験2週間前）',
      '印刷室での事前印刷と部数確認'
    ],
    tips: [
      {
        id: 'tip3',
        author: '田中先生',
        role: '教務部',
        content: '※ギリギリの提出が増えると印刷機がパンクします。なるべく締切の3日前には出してもらえると助かります。',
        createdAt: '2025-04-20',
        likes: 24
      }
    ]
  },
  {
    id: 't3',
    title: '学習用タブレットの初期セットアップ',
    month: 4,
    tags: ['ICT'],
    description: '新1年生向けの学習用タブレットの初期設定と配布を行います。',
    steps: [
      '納品されたタブレットの員数確認',
      'MDM（モバイルデバイス管理）ツールへの登録',
      '初期アカウントの配布用プリント印刷',
      'クラスごとの配布と初回ログイン指導'
    ],
    tips: [
      {
        id: 'tip4',
        author: '高橋先生',
        role: 'ICT担当',
        content: '※生徒の初期パスワードは絶対に口頭で伝えず、配布プリントを各自で確認させてください。パスワード忘れは「ICT支援員」へ直接回すのが早いです。',
        createdAt: '2025-03-25',
        likes: 8
      }
    ]
  },
  {
    id: 't4',
    title: '修学旅行のしおり作成と事前指導',
    month: 9,
    tags: ['行事'],
    description: '修学旅行に向けた生徒用しおりの作成と、全体での事前指導を行います。',
    steps: [
      '旅行業者との最終旅程すり合わせ',
      'しおりの原稿作成（各係の教員で分担）',
      'しおりの印刷と製本（生徒による作業）',
      '体育館での全体事前指導と持ち物確認'
    ],
    tips: [
      {
        id: 'tip5',
        author: '渡辺先生',
        role: '前年度 2学年主任',
        content: '※アレルギー情報の確認は絶対に「しおり作成前」に保健室とダブルチェックしてください！',
        createdAt: '2024-08-10',
        likes: 35
      }
    ]
  },
  {
    id: 't5',
    title: '学年末の成績処理と指導要録作成',
    month: 3,
    tags: ['成績処理', '提出書類'],
    description: '1年間の成績確定と、次年度に向けた指導要録の作成を行います。',
    steps: [
      '全教科の成績データのシステム入力完了',
      '成績会議での承認',
      '通知表の印刷と公印押し',
      '指導要録の作成と教頭の点検'
    ],
    tips: [
      {
        id: 'tip6',
        author: '伊藤先生',
        role: '前年度 教務主任',
        content: '※成績システムの入力は深夜0時で自動メンテに入るので、ギリギリの作業は避けてください。データが消えた先生が過去にいました（涙）',
        createdAt: '2025-02-28',
        likes: 18
      }
    ]
  }
];

export const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
