"""
pages/5_Dashboard.py
Ringkasan dashboard terintegrasi langsung dari Supabase (melengkapi Metabase Tahap 12,
untuk pengguna yang mengakses lewat aplikasi Streamlit tanpa perlu buka Metabase terpisah).

Fitur tambahan: Insight Otomatis — narasi analisis dihasilkan otomatis dari statistik
data real-time (rule-based, deterministik, bukan LLM) sehingga siapa pun yang buka
dashboard langsung dapat kesimpulan, bukan cuma angka mentah.
"""
import os
import sys
import streamlit as st
import pandas as pd
import plotly.express as px

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from utils.db import test_connection, run_query
from utils.styling import inject_custom_css, eyebrow, metric_card, section_divider
from utils.insights import all_insights

st.set_page_config(page_title='Dashboard - Kopdes Sentiment', page_icon='📋', layout='wide')
inject_custom_css()
eyebrow('Ringkasan')
st.markdown('# Dashboard')

METABASE_URL = os.getenv('METABASE_PUBLIC_DASHBOARD_URL', '')
if METABASE_URL:
    st.markdown(f'[Buka Dashboard Metabase Lengkap]({METABASE_URL})')

if not test_connection():
    st.error('Belum terkoneksi ke database Supabase. Cek file `.env`.')
    st.stop()

try:
    total = run_query('SELECT COUNT(*) AS total FROM labeled_comments;')['total'].iloc[0]
    dist = run_query("""
        SELECT sentiment_label, COUNT(*) AS jumlah
        FROM labeled_comments GROUP BY sentiment_label ORDER BY jumlah DESC;
    """)
    video_df = run_query('SELECT * FROM v_sentiment_by_video;')
    trend_df = run_query('SELECT * FROM v_sentiment_daily_trend;')
    model_df = run_query('SELECT * FROM v_model_performance;')

    col1, col2 = st.columns([1, 2])
    with col1:
        metric_card('Total Komentar Berlabel', f'{total:,}', primary=True)

    if not dist.empty:
        fig = px.pie(dist, names='sentiment_label', values='jumlah', title='Distribusi Sentimen',
                     color='sentiment_label',
                     color_discrete_map={'positive': '#55A868', 'neutral': '#4C72B0', 'negative': '#C44E52'})
        col2.plotly_chart(fig, width='stretch')

    # ---------- INSIGHT OTOMATIS ----------
    section_divider('💡 Insight Otomatis')
    st.caption(
        'Narasi berikut dihasilkan otomatis dari statistik data terkini di database — '
        'diperbarui setiap kali halaman ini dimuat ulang.'
    )

    with st.spinner('Menganalisis data...'):
        insights = all_insights(dist, video_df, trend_df, model_df)

    if insights:
        for icon, text in insights:
            st.markdown(f"""
                <div class="kop-card" style="margin-bottom:10px;display:flex;gap:12px;align-items:flex-start;">
                    <div style="font-size:20px;line-height:1.4;">{icon}</div>
                    <div style="font-size:14px;line-height:1.6;color:var(--color-ink);">{text}</div>
                </div>
            """, unsafe_allow_html=True)
    else:
        st.caption('Belum cukup data untuk menghasilkan insight (tabel mungkin masih kosong).')

    st.divider()
    st.subheader('Perbandingan Model')
    if not model_df.empty:
        st.dataframe(model_df, width='stretch')
        fig2 = px.bar(model_df, x='model_name', y=['accuracy', 'macro_precision', 'macro_recall', 'macro_f1'],
                      barmode='group', title='Metrik per Model')
        st.plotly_chart(fig2, width='stretch')

    st.divider()
    st.subheader('Sentimen per Video')
    if not video_df.empty:
        top_videos = video_df.sort_values('total_comments', ascending=False).head(10)
        fig_v = px.bar(
            top_videos, x='video_id', y=['positive_pct', 'neutral_pct', 'negative_pct'],
            barmode='stack', title='Komposisi Sentimen per Video (Top 10 Volume)',
            color_discrete_map={'positive_pct': '#55A868', 'neutral_pct': '#4C72B0', 'negative_pct': '#C44E52'}
        )
        fig_v.update_xaxes(type='category')
        st.plotly_chart(fig_v, width='stretch')

    st.divider()
    st.subheader('Tren Sentimen Harian')
    if not trend_df.empty:
        fig3 = px.line(trend_df, x='comment_date', y='n_comments', color='sentiment_label',
                        title='Tren Sentimen dari Waktu ke Waktu',
                        color_discrete_map={'positive': '#55A868', 'neutral': '#4C72B0', 'negative': '#C44E52'})
        st.plotly_chart(fig3, width='stretch')

    st.divider()
    st.subheader('Log Prediksi Terbaru (dari Halaman Prediction)')
    preds = run_query('SELECT input_text, predicted_label, confidence, model_used, predicted_at '
                       'FROM prediction_history ORDER BY predicted_at DESC LIMIT 20;')
    st.dataframe(preds, width='stretch')

except Exception as e:
    st.warning(f'Sebagian data dashboard belum tersedia (tabel mungkin masih kosong): {e}')
