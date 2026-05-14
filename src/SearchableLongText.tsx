import React, {
  createRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export type SearchableLongTextInputRenderProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmitEditing: () => void;
  onClear: () => void;
  placeholder: string;
  editable: boolean;
  hasValue: boolean;
  isSearching: boolean;
  textInputProps: TextInputProps;
};

export type SearchableLongTextNavButtonRenderProps = {
  disabled: boolean;
  activeIndex: number;
  totalMatches: number;
  renderedMatches: number;
  onPress: () => void;
  direction: 'previous' | 'next';
};

export type SearchableLongTextScrollTopRenderProps = {
  visible: boolean;
  onPress: () => void;
};

export type SearchableLongTextResult = {
  query: string;
  searchQuery: string;
  totalMatches: number;
  renderedMatches: number;
  activeIndex: number;
  isQueryTooShort: boolean;
  isSearchPending: boolean;
  isSearching: boolean;
  hasMoreMatches: boolean;
};

export type SearchableLongTextProps = {
  text: string;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  onResultChange?: (result: SearchableLongTextResult) => void;
  placeholder?: string;
  caseSensitive?: boolean;
  trimQuery?: boolean;
  minimumQueryLength?: number;
  autoScrollToFirstMatch?: boolean;
  scrollAnimationEnabled?: boolean;
  matchScrollOffset?: number;
  maxRenderedMatches?: number;
  plainTextChunkSize?: number;
  showScrollToTopAfterY?: number;
  hideScrollToTopAtTop?: boolean;
  scrollViewProps?: Omit<ScrollViewProps, 'children' | 'ref'>;
  textInputProps?: Omit<TextInputProps, 'onChangeText' | 'value'>;
  renderSearchInput?: (
    props: SearchableLongTextInputRenderProps,
  ) => React.ReactNode;
  renderPreviousButton?: (
    props: SearchableLongTextNavButtonRenderProps,
  ) => React.ReactNode;
  renderNextButton?: (
    props: SearchableLongTextNavButtonRenderProps,
  ) => React.ReactNode;
  renderScrollToTopButton?: (
    props: SearchableLongTextScrollTopRenderProps,
  ) => React.ReactNode;
  renderResultLabel?: (result: SearchableLongTextResult) => React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  searchBarStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  resultLabelStyle?: StyleProp<TextStyle>;
  navButtonStyle?: StyleProp<ViewStyle>;
  navButtonDisabledStyle?: StyleProp<ViewStyle>;
  navButtonPressedStyle?: StyleProp<ViewStyle>;
  navButtonTextStyle?: StyleProp<TextStyle>;
  previousButtonStyle?: StyleProp<ViewStyle>;
  nextButtonStyle?: StyleProp<ViewStyle>;
  scrollContentStyle?: StyleProp<ViewStyle>;
  textFlowStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  plainTextStyle?: StyleProp<TextStyle>;
  matchTextStyle?: StyleProp<TextStyle>;
  activeMatchTextStyle?: StyleProp<TextStyle>;
  scrollToTopButtonStyle?: StyleProp<ViewStyle>;
  scrollToTopButtonPressedStyle?: StyleProp<ViewStyle>;
  scrollToTopButtonTextStyle?: StyleProp<TextStyle>;
  navButtonBackgroundColor?: string;
  navButtonDisabledBackgroundColor?: string;
  navButtonPressedBackgroundColor?: string;
  navButtonArrowColor?: string;
  scrollToTopButtonBackgroundColor?: string;
  scrollToTopButtonPressedBackgroundColor?: string;
  scrollToTopButtonArrowColor?: string;
  matchBackgroundColor?: string;
  activeMatchBackgroundColor?: string;
  matchTextColor?: string;
  activeMatchTextColor?: string;
};

type Segment = {
  text: string;
  isMatch: boolean;
  matchIndex?: number;
};

type SearchResult = {
  segments: Segment[];
  totalCount: number;
  renderedCount: number;
};

type TextInputSubmitEvent = Parameters<
  NonNullable<TextInputProps['onSubmitEditing']>
>[0];

const DEFAULT_SEARCHBAR_HEIGHT = 80;
const DEFAULT_SCROLL_PADDING = 24;
const DEFAULT_PLAIN_TEXT_CHUNK_SIZE = 1200;
const DEFAULT_SHOW_SCROLL_TOP_AFTER_Y = 260;
const DEFAULT_MINIMUM_QUERY_LENGTH = 2;
const DEFAULT_MAX_RENDERED_MATCHES = 100;

export function SearchableLongText({
  text,
  query,
  defaultQuery = '',
  onQueryChange,
  onResultChange,
  placeholder = 'Search within the long text',
  caseSensitive = false,
  trimQuery = true,
  minimumQueryLength = DEFAULT_MINIMUM_QUERY_LENGTH,
  autoScrollToFirstMatch = true,
  scrollAnimationEnabled = true,
  matchScrollOffset = DEFAULT_SEARCHBAR_HEIGHT + DEFAULT_SCROLL_PADDING,
  maxRenderedMatches = DEFAULT_MAX_RENDERED_MATCHES,
  plainTextChunkSize = DEFAULT_PLAIN_TEXT_CHUNK_SIZE,
  showScrollToTopAfterY = DEFAULT_SHOW_SCROLL_TOP_AFTER_Y,
  hideScrollToTopAtTop = true,
  scrollViewProps,
  textInputProps,
  renderSearchInput,
  renderPreviousButton,
  renderNextButton,
  renderScrollToTopButton,
  renderResultLabel,
  containerStyle,
  searchBarStyle,
  inputStyle,
  resultLabelStyle,
  navButtonStyle,
  navButtonDisabledStyle,
  navButtonPressedStyle,
  navButtonTextStyle,
  previousButtonStyle,
  nextButtonStyle,
  scrollContentStyle,
  textFlowStyle,
  textStyle,
  plainTextStyle,
  matchTextStyle,
  activeMatchTextStyle,
  scrollToTopButtonStyle,
  scrollToTopButtonPressedStyle,
  scrollToTopButtonTextStyle,
  navButtonBackgroundColor,
  navButtonDisabledBackgroundColor,
  navButtonPressedBackgroundColor,
  navButtonArrowColor,
  scrollToTopButtonBackgroundColor,
  scrollToTopButtonPressedBackgroundColor,
  scrollToTopButtonArrowColor,
  matchBackgroundColor,
  activeMatchBackgroundColor,
  matchTextColor,
  activeMatchTextColor,
}: SearchableLongTextProps) {
  const isControlledQuery = query !== undefined;
  const [internalQuery, setInternalQuery] = useState(defaultQuery);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const matchRefs = useRef(new Map<number, React.RefObject<Text | null>>());
  const matchPositions = useRef(new Map<number, number>());
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQuery = isControlledQuery ? query : internalQuery;
  const normalizedQuery = trimQuery ? currentQuery.trim() : currentQuery;
  const safeMinimumQueryLength = Math.max(1, minimumQueryLength);
  const [submittedQuery, setSubmittedQuery] = useState(() => {
    const initialQuery = query ?? defaultQuery;
    const normalizedInitialQuery = trimQuery ? initialQuery.trim() : initialQuery;

    return normalizedInitialQuery.length >= safeMinimumQueryLength
      ? normalizedInitialQuery
      : '';
  });
  const isQueryTooShort =
    normalizedQuery.length > 0 && normalizedQuery.length < safeMinimumQueryLength;
  const isSearchPending =
    normalizedQuery.length >= safeMinimumQueryLength &&
    normalizedQuery !== submittedQuery;
  const searchableQuery =
    submittedQuery.length >= safeMinimumQueryLength ? submittedQuery : '';

  const safeMaxRenderedMatches = Math.max(1, maxRenderedMatches);
  const { segments, totalCount, renderedCount } = useMemo(
    () =>
      buildSearchSegments({
        text,
        query: searchableQuery,
        caseSensitive,
        maxRenderedMatches: safeMaxRenderedMatches,
      }),
    [caseSensitive, safeMaxRenderedMatches, searchableQuery, text],
  );
  const hasMoreMatches = totalCount > renderedCount;

  const setSearchQuery = useCallback(
    (nextQuery: string) => {
      if (!isControlledQuery) {
        setInternalQuery(nextQuery);
      }

      const normalizedNextQuery = trimQuery ? nextQuery.trim() : nextQuery;

      if (normalizedNextQuery.length < safeMinimumQueryLength) {
        setSubmittedQuery('');
        setIsSearching(false);
      }

      onQueryChange?.(nextQuery);
    },
    [isControlledQuery, onQueryChange, safeMinimumQueryLength, trimQuery],
  );

  const submitSearch = useCallback(() => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    if (normalizedQuery.length < safeMinimumQueryLength) {
      setIsSearching(false);
      setSubmittedQuery('');
      return;
    }

    setIsSearching(true);
    submitTimeoutRef.current = setTimeout(() => {
      setSubmittedQuery(normalizedQuery);
      submitTimeoutRef.current = null;
    }, 50);
  }, [normalizedQuery, safeMinimumQueryLength]);

  const clearSearch = useCallback(() => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
      submitTimeoutRef.current = null;
    }

    if (!isControlledQuery) {
      setInternalQuery('');
    }

    setSubmittedQuery('');
    setIsSearching(false);
    onQueryChange?.('');
  }, [isControlledQuery, onQueryChange]);

  useEffect(() => {
    if (normalizedQuery.length < safeMinimumQueryLength) {
      setSubmittedQuery('');
      setIsSearching(false);
    }
  }, [normalizedQuery, safeMinimumQueryLength]);

  useEffect(() => {
    setSubmittedQuery(currentSubmittedQuery =>
      currentSubmittedQuery.length >= safeMinimumQueryLength
        ? currentSubmittedQuery
        : '',
    );
  }, [safeMinimumQueryLength]);

  useEffect(() => {
    if (!isControlledQuery) {
      return;
    }

    if (normalizedQuery.length < safeMinimumQueryLength) {
      setSubmittedQuery('');
      setIsSearching(false);
    }
  }, [isControlledQuery, normalizedQuery, safeMinimumQueryLength]);

  useEffect(() => {
    setIsSearching(false);
  }, [renderedCount, searchableQuery, totalCount]);

  useEffect(
    () => () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    },
    [],
  );

  const handleSubmitEditing = useCallback(
    (event: TextInputSubmitEvent) => {
      textInputProps?.onSubmitEditing?.(event);
      submitSearch();
    },
    [submitSearch, textInputProps],
  );

  useEffect(() => {
    matchPositions.current.clear();
    setActiveIndex(renderedCount > 0 && autoScrollToFirstMatch ? 0 : -1);
  }, [autoScrollToFirstMatch, renderedCount, searchableQuery]);

  useEffect(() => {
    onResultChange?.({
      query: normalizedQuery,
      searchQuery: searchableQuery,
      totalMatches: totalCount,
      renderedMatches: renderedCount,
      activeIndex,
      isQueryTooShort,
      isSearchPending,
      isSearching,
      hasMoreMatches,
    });
  }, [
    activeIndex,
    hasMoreMatches,
    renderedCount,
    isSearching,
    isSearchPending,
    isQueryTooShort,
    normalizedQuery,
    onResultChange,
    searchableQuery,
    totalCount,
  ]);

  const getMatchRef = useCallback((matchIndex: number) => {
    const existingRef = matchRefs.current.get(matchIndex);

    if (existingRef) {
      return existingRef;
    }

    const nextRef = createRef<Text>();
    matchRefs.current.set(matchIndex, nextRef);
    return nextRef;
  }, []);

  const scrollToY = useCallback(
    (y: number) => {
      scrollRef.current?.scrollTo({
        y: Math.max(y - matchScrollOffset, 0),
        animated: scrollAnimationEnabled,
      });
    },
    [matchScrollOffset, scrollAnimationEnabled],
  );

  const scrollToMatch = useCallback(
    (matchIndex: number) => {
      const knownY = matchPositions.current.get(matchIndex);

      if (knownY !== undefined) {
        scrollToY(knownY);
        return;
      }

      const matchNode = matchRefs.current.get(matchIndex)?.current;
      const contentNode = contentRef.current;

      if (!matchNode || !contentNode) {
        requestAnimationFrame(() => {
          const delayedY = matchPositions.current.get(matchIndex);

          if (delayedY !== undefined) {
            scrollToY(delayedY);
          }
        });
        return;
      }

      matchNode.measureLayout(
        contentNode,
        (_x, y) => {
          matchPositions.current.set(matchIndex, y);
          scrollToY(y);
        },
        () => undefined,
      );
    },
    [scrollToY],
  );

  const handleMatchLayout = useCallback(
    (matchIndex: number, event: LayoutChangeEvent) => {
      matchPositions.current.set(matchIndex, event.nativeEvent.layout.y);

      if (matchIndex === activeIndex) {
        scrollToY(event.nativeEvent.layout.y);
      }
    },
    [activeIndex, scrollToY],
  );

  useLayoutEffect(() => {
    if (activeIndex < 0 || renderedCount === 0) {
      return;
    }

    scrollToMatch(activeIndex);
  }, [activeIndex, renderedCount, scrollToMatch]);

  const moveSelection = useCallback(
    (direction: 1 | -1) => {
      if (renderedCount === 0) {
        return;
      }

      setActiveIndex(currentIndex => {
        if (currentIndex < 0) {
          return direction === 1 ? 0 : renderedCount - 1;
        }

        return (currentIndex + direction + renderedCount) % renderedCount;
      });
    },
    [renderedCount],
  );

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: 0,
      animated: scrollAnimationEnabled,
    });
  }, [scrollAnimationEnabled]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollViewProps?.onScroll?.(event);

      if (!hideScrollToTopAtTop) {
        setShowScrollTop(true);
        return;
      }

      const nextShowScrollTop =
        event.nativeEvent.contentOffset.y > showScrollToTopAfterY;

      setShowScrollTop(current =>
        current === nextShowScrollTop ? current : nextShowScrollTop,
      );
    },
    [hideScrollToTopAtTop, scrollViewProps, showScrollToTopAfterY],
  );

  const result = useMemo(
    () => ({
      query: normalizedQuery,
      searchQuery: searchableQuery,
      totalMatches: totalCount,
      renderedMatches: renderedCount,
      activeIndex,
      isQueryTooShort,
      isSearchPending,
      isSearching,
      hasMoreMatches,
    }),
    [
      activeIndex,
      hasMoreMatches,
      renderedCount,
      isQueryTooShort,
      isSearching,
      isSearchPending,
      normalizedQuery,
      searchableQuery,
      totalCount,
    ],
  );

  const resultLabel = renderResultLabel
    ? renderResultLabel(result)
    : getDefaultResultLabel(result);
  const shouldShowResultLabel =
    isSearching ||
    (typeof resultLabel === 'string'
      ? resultLabel.length > 0
      : resultLabel !== null && resultLabel !== undefined);
  const shouldShowNavigationButtons = renderedCount > 0;

  const inputNode = renderSearchInput ? (
    renderSearchInput({
      value: currentQuery,
      onChangeText: setSearchQuery,
      onSubmitEditing: submitSearch,
      onClear: clearSearch,
      placeholder,
      editable: textInputProps?.editable ?? true,
      hasValue: currentQuery.length > 0,
      isSearching,
      textInputProps: textInputProps ?? {},
    })
  ) : (
    <View style={styles.inputShell}>
      <TextInput
        {...textInputProps}
        value={currentQuery}
        onChangeText={setSearchQuery}
        placeholder={placeholder}
        placeholderTextColor={textInputProps?.placeholderTextColor ?? '#7b8292'}
        autoCorrect={textInputProps?.autoCorrect ?? false}
        autoCapitalize={textInputProps?.autoCapitalize ?? 'none'}
        clearButtonMode="never"
        onSubmitEditing={handleSubmitEditing}
        style={[styles.input, inputStyle, textInputProps?.style]}
        returnKeyType={textInputProps?.returnKeyType ?? 'done'}
      />
      {currentQuery.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search text"
          onPress={clearSearch}
          style={styles.inputIconButton}>
          <Text style={styles.inputClearIcon}>×</Text>
        </Pressable>
      ) : (
        <View style={styles.inputIconButton} pointerEvents="none">
          <MaterialIcons
            name="search"
            size={22}
            style={styles.inputSearchIcon}
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.searchBar, searchBarStyle]}>
        {inputNode}
        {shouldShowResultLabel &&
          (isSearching ? (
            <View style={styles.resultLoader}>
              <ActivityIndicator color="#3d4658" size="small" />
            </View>
          ) : typeof resultLabel === 'string' || typeof resultLabel === 'number' ? (
            <Text style={[styles.resultLabel, resultLabelStyle]}>
              {resultLabel}
            </Text>
          ) : (
            resultLabel
          ))}
        {shouldShowNavigationButtons && (
          <View style={styles.buttonGroup}>
            {renderNavigationButton({
              direction: 'previous',
              disabled: false,
              activeIndex,
              totalMatches: totalCount,
              renderedMatches: renderedCount,
              onPress: () => moveSelection(-1),
              renderButton: renderPreviousButton,
              navButtonStyle,
              navButtonDisabledStyle,
              navButtonPressedStyle,
              navButtonTextStyle,
              directionButtonStyle: previousButtonStyle,
              backgroundColor: navButtonBackgroundColor,
              disabledBackgroundColor: navButtonDisabledBackgroundColor,
              pressedBackgroundColor: navButtonPressedBackgroundColor,
              arrowColor: navButtonArrowColor,
            })}
            {renderNavigationButton({
              direction: 'next',
              disabled: false,
              activeIndex,
              totalMatches: totalCount,
              renderedMatches: renderedCount,
              onPress: () => moveSelection(1),
              renderButton: renderNextButton,
              navButtonStyle,
              navButtonDisabledStyle,
              navButtonPressedStyle,
              navButtonTextStyle,
              directionButtonStyle: nextButtonStyle,
              backgroundColor: navButtonBackgroundColor,
              disabledBackgroundColor: navButtonDisabledBackgroundColor,
              pressedBackgroundColor: navButtonPressedBackgroundColor,
              arrowColor: navButtonArrowColor,
            })}
          </View>
        )}
      </View>

      <ScrollView
        {...scrollViewProps}
        ref={scrollRef}
        keyboardShouldPersistTaps={
          scrollViewProps?.keyboardShouldPersistTaps ?? 'handled'
        }
        onScroll={handleScroll}
        scrollEventThrottle={scrollViewProps?.scrollEventThrottle ?? 16}
        contentContainerStyle={[
          styles.scrollContent,
          scrollContentStyle,
          scrollViewProps?.contentContainerStyle,
        ]}>
        <View ref={contentRef} style={[styles.textFlow, textFlowStyle]}>
          {segments.map((segment, segmentIndex) =>
            renderSegment({
              segment,
              segmentIndex,
              activeIndex,
              getMatchRef,
              onMatchLayout: handleMatchLayout,
              plainTextChunkSize,
              textStyle,
              plainTextStyle,
              matchTextStyle,
              activeMatchTextStyle,
              matchBackgroundColor,
              activeMatchBackgroundColor,
              matchTextColor,
              activeMatchTextColor,
            }),
          )}
        </View>
      </ScrollView>

      {showScrollTop &&
        (renderScrollToTopButton ? (
          renderScrollToTopButton({
            visible: showScrollTop,
            onPress: scrollToTop,
          })
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scroll to top"
            onPress={scrollToTop}
            style={({ pressed }) => [
              styles.scrollTopButton,
              scrollToTopButtonBackgroundColor && {
                backgroundColor: scrollToTopButtonBackgroundColor,
              },
              scrollToTopButtonStyle,
              pressed && styles.scrollTopButtonPressed,
              pressed &&
              scrollToTopButtonPressedBackgroundColor && {
                backgroundColor: scrollToTopButtonPressedBackgroundColor,
              },
              pressed && scrollToTopButtonPressedStyle,
            ]}>
            <Text
              style={[
                styles.scrollTopButtonText,
                scrollToTopButtonArrowColor && {
                  color: scrollToTopButtonArrowColor,
                },
                scrollToTopButtonTextStyle,
              ]}>
              ↑
            </Text>
          </Pressable>
        ))}
    </View>
  );
}

function buildSearchSegments({
  text,
  query,
  caseSensitive,
  maxRenderedMatches,
}: {
  text: string;
  query: string;
  caseSensitive: boolean;
  maxRenderedMatches: number;
}): SearchResult {
  if (!query) {
    return {
      segments: [{ text, isMatch: false }],
      totalCount: 0,
      renderedCount: 0,
    };
  }

  const segments: Segment[] = [];
  const searchableText = caseSensitive ? text : text.toLocaleLowerCase();
  const searchableQuery = caseSensitive ? query : query.toLocaleLowerCase();
  let cursor = 0;
  let totalCount = 0;
  let renderedCount = 0;
  let plainTextCursor = 0;

  while (cursor < text.length) {
    const matchStart = searchableText.indexOf(searchableQuery, cursor);

    if (matchStart === -1) {
      break;
    }

    const matchEnd = matchStart + query.length;

    if (renderedCount < maxRenderedMatches) {
      if (matchStart > plainTextCursor) {
        segments.push({
          text: text.slice(plainTextCursor, matchStart),
          isMatch: false,
        });
      }

      segments.push({
        text: text.slice(matchStart, matchEnd),
        isMatch: true,
        matchIndex: renderedCount,
      });

      renderedCount += 1;
      plainTextCursor = matchEnd;
    }

    totalCount += 1;
    cursor = matchEnd;
  }

  if (plainTextCursor < text.length) {
    segments.push({ text: text.slice(plainTextCursor), isMatch: false });
  }

  return { segments, totalCount, renderedCount };
}

function renderNavigationButton({
  direction,
  disabled,
  activeIndex,
  totalMatches,
  renderedMatches,
  onPress,
  renderButton,
  navButtonStyle,
  navButtonDisabledStyle,
  navButtonPressedStyle,
  navButtonTextStyle,
  directionButtonStyle,
  backgroundColor,
  disabledBackgroundColor,
  pressedBackgroundColor,
  arrowColor,
}: SearchableLongTextNavButtonRenderProps & {
  renderButton?: (
    props: SearchableLongTextNavButtonRenderProps,
  ) => React.ReactNode;
  navButtonStyle?: StyleProp<ViewStyle>;
  navButtonDisabledStyle?: StyleProp<ViewStyle>;
  navButtonPressedStyle?: StyleProp<ViewStyle>;
  navButtonTextStyle?: StyleProp<TextStyle>;
  directionButtonStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  disabledBackgroundColor?: string;
  pressedBackgroundColor?: string;
  arrowColor?: string;
}) {
  if (renderButton) {
    return renderButton({
      direction,
      disabled,
      activeIndex,
      totalMatches,
      renderedMatches,
      onPress,
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        direction === 'previous' ? 'Previous match' : 'Next match'
      }
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.navButton,
        backgroundColor && { backgroundColor },
        navButtonStyle,
        directionButtonStyle,
        disabled && styles.disabledButton,
        disabled &&
        disabledBackgroundColor && { backgroundColor: disabledBackgroundColor },
        disabled && navButtonDisabledStyle,
        pressed && !disabled && styles.pressedButton,
        pressed &&
        !disabled &&
        pressedBackgroundColor && { backgroundColor: pressedBackgroundColor },
        pressed && !disabled && navButtonPressedStyle,
      ]}>
      <Text
        style={[
          styles.navButtonText,
          arrowColor && { color: arrowColor },
          navButtonTextStyle,
        ]}>
        {direction === 'previous' ? '↑' : '↓'}
      </Text>
    </Pressable>
  );
}

function renderSegment({
  segment,
  segmentIndex,
  activeIndex,
  getMatchRef,
  onMatchLayout,
  plainTextChunkSize,
  textStyle,
  plainTextStyle,
  matchTextStyle,
  activeMatchTextStyle,
  matchBackgroundColor,
  activeMatchBackgroundColor,
  matchTextColor,
  activeMatchTextColor,
}: {
  segment: Segment;
  segmentIndex: number;
  activeIndex: number;
  getMatchRef: (matchIndex: number) => React.RefObject<Text | null>;
  onMatchLayout: (matchIndex: number, event: LayoutChangeEvent) => void;
  plainTextChunkSize: number;
  textStyle?: StyleProp<TextStyle>;
  plainTextStyle?: StyleProp<TextStyle>;
  matchTextStyle?: StyleProp<TextStyle>;
  activeMatchTextStyle?: StyleProp<TextStyle>;
  matchBackgroundColor?: string;
  activeMatchBackgroundColor?: string;
  matchTextColor?: string;
  activeMatchTextColor?: string;
}) {
  if (segment.isMatch && segment.matchIndex !== undefined) {
    const isActive = segment.matchIndex === activeIndex;

    return (
      <Text
        key={`match-${segment.matchIndex}`}
        ref={getMatchRef(segment.matchIndex)}
        onLayout={event => onMatchLayout(segment.matchIndex!, event)}
        style={[
          styles.bodyText,
          styles.textSegment,
          textStyle,
          styles.matchText,
          matchBackgroundColor && { backgroundColor: matchBackgroundColor },
          matchTextColor && { color: matchTextColor },
          matchTextStyle,
          isActive && styles.activeMatchText,
          isActive &&
          activeMatchBackgroundColor && {
            backgroundColor: activeMatchBackgroundColor,
          },
          isActive && activeMatchTextColor && { color: activeMatchTextColor },
          isActive && activeMatchTextStyle,
        ]}>
        {segment.text}
      </Text>
    );
  }

  return splitPlainText(segment.text, plainTextChunkSize).map(
    (chunk, chunkIndex) => (
      <Text
        key={`plain-${segmentIndex}-${chunkIndex}`}
        style={[
          styles.bodyText,
          styles.textSegment,
          textStyle,
          plainTextStyle,
        ]}>
        {chunk}
      </Text>
    ),
  );
}

function splitPlainText(text: string, chunkSize: number) {
  const chunks: string[] = [];
  let cursor = 0;
  const safeChunkSize = Math.max(chunkSize, 200);

  while (cursor < text.length) {
    const nextLimit = Math.min(cursor + safeChunkSize, text.length);

    if (nextLimit === text.length) {
      chunks.push(text.slice(cursor));
      break;
    }

    const paragraphBreak = text.lastIndexOf('\n\n', nextLimit);
    const sentenceBreak = text.lastIndexOf('. ', nextLimit);
    const spaceBreak = text.lastIndexOf(' ', nextLimit);
    const breakAt =
      paragraphBreak > cursor
        ? paragraphBreak + 2
        : sentenceBreak > cursor
          ? sentenceBreak + 2
          : spaceBreak > cursor
            ? spaceBreak + 1
            : nextLimit;

    chunks.push(text.slice(cursor, breakAt));
    cursor = breakAt;
  }

  return chunks;
}

function getDefaultResultLabel({
  query,
  isQueryTooShort,
  isSearchPending,
  isSearching,
  totalMatches,
  renderedMatches,
  hasMoreMatches,
  activeIndex,
}: SearchableLongTextResult) {
  if (isSearching) {
    return '';
  }

  if (isSearchPending) {
    return 'Press Done';
  }

  if (isQueryTooShort) {
    return 'Keep typing';
  }

  if (totalMatches === 0) {
    return query ? '0 matches' : '';
  }

  if (hasMoreMatches) {
    return `${activeIndex + 1} / ${renderedMatches} (${totalMatches} found)`;
  }

  return `${activeIndex + 1} / ${totalMatches}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    minHeight: DEFAULT_SEARCHBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomColor: '#d9dde7',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputShell: {
    flex: 1,
    position: 'relative',
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cfd5df',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
  },
  input: {
    minHeight: 44,
    color: '#121826',
    fontSize: 16,
    paddingLeft: 12,
    paddingRight: 44,
  },
  inputIconButton: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputSearchIcon: {
    color: '#7b8292',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  inputClearIcon: {
    color: '#3d4658',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  resultLabel: {
    minWidth: 84,
    color: '#3d4658',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultLoader: {
    minWidth: 84,
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f6feb',
  },
  pressedButton: {
    backgroundColor: '#185abd',
  },
  disabledButton: {
    backgroundColor: '#b8bfcc',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  scrollContent: {
    padding: 18,
  },
  textFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    paddingBottom: 80,
  },
  textSegment: {
    flexShrink: 1,
    maxWidth: '100%',
  },
  bodyText: {
    color: '#202636',
    fontSize: 18,
    lineHeight: 30,
  },
  matchText: {
    backgroundColor: '#ffe082',
    color: '#161b22',
    borderRadius: 4,
  },
  activeMatchText: {
    backgroundColor: '#ff8a3d',
    color: '#ffffff',
  },
  scrollTopButton: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121826',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  scrollTopButtonPressed: {
    backgroundColor: '#2f3748',
  },
  scrollTopButtonText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 28,
  },
});
