import * as React from 'react';
import Head from 'next/head';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import theme from '../config/theme';
import createEmotionCache from '../config/createEmotionCache';
import { NoSsr } from '@mui/material';

const clientSideEmotionCache = createEmotionCache();

export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  return (
    <NoSsr>
      <CacheProvider value={emotionCache}>
        <Head>
          <title>Collab Tool</title>
          <meta name="description" content="This is a Trello Clone."/>
          <meta name="viewport" content="initial-scale=1, width=device-width"/>
        </Head>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Component {...pageProps} />
        </ThemeProvider>
      </CacheProvider>
    </NoSsr>
  );
}
