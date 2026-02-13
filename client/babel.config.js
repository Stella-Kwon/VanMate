module.exports = function (api) {
    api.cache(true);
    // 웹이 아닐 때만 reanimated 플러그인 사용 (웹에서 CSSStyleDeclaration 에러 방지)
    return {
        presets: ["babel-preset-expo"],
        plugins: [
            ...(process.env.BUILD_TARGET !== "web"
            ? ["react-native-reanimated/plugin"]
            : []),
        ],
    };
};
