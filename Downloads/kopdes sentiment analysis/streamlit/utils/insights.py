"""
utils/insights.py
Menghasilkan narasi insight otomatis (rule-based, dari statistik data asli)
untuk halaman Dashboard — bukan LLM, murni analisis statistik deterministik
supaya cepat & tidak butuh API key tambahan.

Setiap insight dikembalikan sebagai tuple (icon, teks) supaya ikon yang
ditampilkan selalu sesuai konteksnya (bukan sekadar diputar berurutan).
"""
import pandas as pd


def sentiment_overview_insight(dist_df: pd.DataFrame) -> list[tuple[str, str]]:
    """dist_df: kolom ['sentiment_label', 'jumlah'] dari query distribusi sentimen."""
    insights = []
    if dist_df.empty:
        return insights

    total = dist_df['jumlah'].sum()
    dist_series = dist_df.set_index('sentiment_label')['jumlah']

    dominant = dist_series.idxmax()
    dominant_pct = dist_series.max() / total * 100
    label_id = {'positive': 'positif', 'neutral': 'netral', 'negative': 'negatif'}

    insights.append((
        '📊',
        f"Mayoritas komentar publik ({dominant_pct:.1f}%) menunjukkan sentimen "
        f"**{label_id.get(dominant, dominant)}** terhadap program ini."
    ))

    if 'positive' in dist_series and 'negative' in dist_series:
        ratio = dist_series.get('negative', 0) / max(dist_series.get('positive', 1), 1)
        if ratio >= 2:
            insights.append((
                '⚖️',
                f"Komentar negatif **{ratio:.1f}x lebih banyak** dibanding positif — "
                f"menandakan tingkat kritik publik yang cukup tinggi terhadap pelaksanaan program."
            ))
        elif ratio <= 0.5:
            insights.append((
                '⚖️',
                f"Komentar positif **{1/ratio:.1f}x lebih banyak** dibanding negatif — "
                f"menandakan penerimaan publik yang cenderung baik."
            ))
        else:
            insights.append((
                '⚖️',
                "Perbandingan komentar positif dan negatif relatif seimbang, "
                "menandakan opini publik yang terbelah."
            ))
    return insights


def video_insight(sentiment_by_video_df: pd.DataFrame) -> list[tuple[str, str]]:
    """kolom: video_id, positive_pct, negative_pct, total_comments."""
    insights = []
    if sentiment_by_video_df.empty or len(sentiment_by_video_df) < 2:
        return insights

    df = sentiment_by_video_df[sentiment_by_video_df['total_comments'] >= 100]
    if df.empty:
        return insights

    most_positive = df.loc[df['positive_pct'].idxmax()]
    most_negative = df.loc[df['negative_pct'].idxmax()]
    busiest = df.loc[df['total_comments'].idxmax()]

    insights.append((
        '🌟',
        f"Video dengan ID `...{str(int(most_positive['video_id']))[-6:]}` memiliki proporsi "
        f"sentimen **paling positif** ({most_positive['positive_pct']:.1f}%) di antara video dengan "
        f"komentar signifikan (≥100 komentar)."
    ))
    insights.append((
        '⚠️',
        f"Sebaliknya, video `...{str(int(most_negative['video_id']))[-6:]}` memiliki proporsi "
        f"sentimen **paling negatif** ({most_negative['negative_pct']:.1f}%)."
    ))
    insights.append((
        '🎥',
        f"Video `...{str(int(busiest['video_id']))[-6:]}` adalah yang **paling ramai diperbincangkan** "
        f"({int(busiest['total_comments']):,} komentar)."
    ))
    return insights


def trend_insight(daily_trend_df: pd.DataFrame) -> list[tuple[str, str]]:
    """kolom: comment_date, sentiment_label, n_comments."""
    insights = []
    if daily_trend_df.empty:
        return insights

    daily_trend_df = daily_trend_df.copy()
    daily_trend_df['comment_date'] = pd.to_datetime(daily_trend_df['comment_date'])

    pivot = daily_trend_df.pivot_table(
        index='comment_date', columns='sentiment_label', values='n_comments', aggfunc='sum'
    ).fillna(0)

    if len(pivot) < 4:
        return insights

    pivot['total'] = pivot.sum(axis=1)
    pivot['negative_pct'] = pivot.get('negative', 0) / pivot['total'].replace(0, 1) * 100

    mid = len(pivot) // 2
    first_half_neg = pivot['negative_pct'].iloc[:mid].mean()
    second_half_neg = pivot['negative_pct'].iloc[mid:].mean()
    delta = second_half_neg - first_half_neg

    if abs(delta) >= 5:
        arah = "memburuk" if delta > 0 else "membaik"
        icon = '📉' if delta > 0 else '📈'
        insights.append((
            icon,
            f"Tren sentimen negatif **{arah}** dari waktu ke waktu — proporsi negatif "
            f"bergerak dari rata-rata {first_half_neg:.1f}% di paruh awal periode menjadi "
            f"{second_half_neg:.1f}% di paruh akhir."
        ))
    else:
        insights.append((
            '➡️',
            "Proporsi sentimen negatif relatif **stabil** sepanjang periode data, "
            "tidak menunjukkan tren memburuk atau membaik yang signifikan."
        ))

    peak_day = pivot['total'].idxmax()
    peak_val = pivot['total'].max()
    insights.append((
        '📅',
        f"Lonjakan volume komentar tertinggi terjadi pada **{peak_day.strftime('%d %B %Y')}** "
        f"({int(peak_val):,} komentar dalam sehari) — kemungkinan bertepatan dengan momen video "
        f"tersebut viral atau ada pemberitaan terkait."
    ))
    return insights


def model_insight(model_perf_df: pd.DataFrame) -> list[tuple[str, str]]:
    """kolom: model_name, accuracy, macro_precision, macro_recall, macro_f1, is_best_model."""
    insights = []
    if model_perf_df.empty:
        return insights

    df = model_perf_df.sort_values('macro_f1', ascending=False).reset_index(drop=True)
    best = df.iloc[0]

    insights.append((
        '🏆',
        f"Model **{best['model_name']}** menjadi model terbaik dengan Macro F1-Score "
        f"**{best['macro_f1']:.3f}** dan akurasi **{best['accuracy']:.1%}**."
    ))

    if len(df) > 1:
        gap = best['macro_f1'] - df.iloc[1]['macro_f1']
        if gap < 0.02:
            insights.append((
                '🤏',
                f"Selisih performa dengan model kedua ({df.iloc[1]['model_name']}) sangat tipis "
                f"({gap:.3f} poin Macro F1) — kedua model sama-sama layak dipertimbangkan."
            ))
        else:
            insights.append((
                '📐',
                f"Model terbaik unggul **{gap:.3f} poin** Macro F1 dibanding model kedua "
                f"({df.iloc[1]['model_name']}) — perbedaan yang cukup jelas."
            ))
    return insights


def all_insights(dist_df, video_df, trend_df, model_df) -> list[tuple[str, str]]:
    """Gabungkan semua insight jadi satu list terurut, tiap item (icon, teks)."""
    result = []
    result += sentiment_overview_insight(dist_df)
    result += model_insight(model_df)
    result += video_insight(video_df)
    result += trend_insight(trend_df)
    return result
