function calculatePatterns(dreams: any[]) {
  const patterns: any = { themes: {}, emotions: {} };

  dreams.forEach((dream) => {
    dream.themes.forEach((theme: string) => {
      patterns.themes[theme] = (patterns.themes[theme] || 0) + 1;
    });

    dream.emotions.forEach((emotion: string) => {
      patterns.emotions[emotion] = (patterns.emotions[emotion] || 0) + 1;
    });
  });

  return patterns;
}
export default calculatePatterns;
