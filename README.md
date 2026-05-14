# react-native-text-search

Search, highlight, and jump between matches inside very long React Native text.

The component is designed for long articles, legal text, transcripts, books, policy documents, and other content where users need browser-like find-in-page navigation.

## Features

- Search through a single long string.
- Highlight every match.
- Move to next and previous matches.
- Floating scroll-to-top button.
- Handles very large strings by chunking plain text internally.
- Customizable text, input, highlight, navigation buttons, and scroll-to-top button.
- Search runs when the user presses the keyboard Done/Search action.
- Controlled or uncontrolled input query.
- Counts all matches while rendering a safe number of highlights by default.
- Result callbacks for analytics or external UI.

## Installation

```sh
npm install react-native-text-search
npm install react-native-vector-icons
```

This package expects `react`, `react-native`, and `react-native-vector-icons` to already exist in your app. On iOS, run CocoaPods after installing vector icons:

```sh
cd ios
pod install
```

## Basic Usage

```tsx
import React from 'react';
import { SafeAreaView } from 'react-native';
import { SearchableLongText } from 'react-native-text-search';

export function ArticleScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SearchableLongText text={veryLongArticleText} />
    </SafeAreaView>
  );
}
```

## Styling

```tsx
<SearchableLongText
  text={text}
  textStyle={{
    fontSize: 17,
    lineHeight: 28,
    color: '#202124',
  }}
  inputStyle={{
    borderColor: '#444',
    backgroundColor: '#fff',
  }}
  matchBackgroundColor="#fff59d"
  activeMatchBackgroundColor="#ff7043"
  activeMatchTextColor="#fff"
/>
```

## Button Colors

```tsx
<SearchableLongText
  text={text}
  navButtonBackgroundColor="#0f766e"
  navButtonPressedBackgroundColor="#115e59"
  navButtonDisabledBackgroundColor="#94a3b8"
  navButtonArrowColor="#ffffff"
  scrollToTopButtonBackgroundColor="#111827"
  scrollToTopButtonPressedBackgroundColor="#374151"
  scrollToTopButtonArrowColor="#ffffff"
/>
```

## Custom Search Input

```tsx
<SearchableLongText
  text={text}
  renderSearchInput={({
    value,
    onChangeText,
    onSubmitEditing,
    onClear,
    placeholder,
  }) => (
    <MySearchField
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmitEditing}
      onClear={onClear}
      placeholder={placeholder}
    />
  )}
/>
```

## Custom Up And Down Buttons

```tsx
<SearchableLongText
  text={text}
  renderPreviousButton={({ disabled, onPress }) => (
    <MyIconButton disabled={disabled} icon="chevron-up" onPress={onPress} />
  )}
  renderNextButton={({ disabled, onPress }) => (
    <MyIconButton disabled={disabled} icon="chevron-down" onPress={onPress} />
  )}
/>
```

## Custom Scroll To Top Button

```tsx
<SearchableLongText
  text={text}
  renderScrollToTopButton={({ onPress }) => (
    <MyFloatingButton icon="arrow-up" onPress={onPress} />
  )}
/>
```

## Controlled Query

```tsx
const [query, setQuery] = React.useState('');

<SearchableLongText
  text={text}
  query={query}
  onQueryChange={setQuery}
  onResultChange={({ totalMatches, activeIndex }) => {
    console.log({ totalMatches, activeIndex });
  }}
/>;
```

## Important Props

| Prop | Description |
| --- | --- |
| `text` | The long string to render and search. |
| `textStyle` | Base style for all rendered text. |
| `plainTextStyle` | Style for non-match text chunks. |
| `matchTextStyle` | Style for highlighted matches. |
| `activeMatchTextStyle` | Style for the currently selected match. |
| `renderSearchInput` | Replace the built-in `TextInput`. |
| `renderPreviousButton` | Replace the previous-match button. |
| `renderNextButton` | Replace the next-match button. |
| `renderScrollToTopButton` | Replace the floating scroll-to-top button. |
| `renderResultLabel` | Replace the default `1 / 10` label. |
| `query` | Controlled search query. |
| `defaultQuery` | Initial query for uncontrolled usage. |
| `onQueryChange` | Called whenever the query changes. |
| `onResultChange` | Called when query, match count, or active match changes. |
| `caseSensitive` | Enable case-sensitive search. |
| `minimumQueryLength` | Minimum characters required before searching after submit. Defaults to `2`. |
| `maxRenderedMatches` | Maximum matches to render and navigate. All matches are still counted. Defaults to `100`. |
| `plainTextChunkSize` | Internal chunk size for rendering huge text. |
| `matchScrollOffset` | Offset applied when scrolling to a match. |
| `showScrollToTopAfterY` | Scroll Y threshold for showing the top button. |
| `scrollViewProps` | Extra props passed to the internal `ScrollView`. |
| `textInputProps` | Extra props passed to the built-in `TextInput`. |

## Development

```sh
npm start
npm run ios
npm run android
npm run lint
npm test -- --watchAll=false
npx tsc --noEmit
```

## Contributing

Contributions are welcome. If you find a bug, have trouble integrating the package, or want to request an improvement, please open a GitHub issue with a clear reproduction or example.

Pull requests are welcome for fixes, documentation improvements, and well-scoped features.

## License

MIT
