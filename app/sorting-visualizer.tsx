'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const DEFAULT_ARRAY_SIZE = 50
const ANIMATION_SPEED = 0.3
const DELAY_SPEED = 1000

type SortingAlgorithm = 'bubble' | 'insertion' | 'selection' | 'quick'

export default function SortingVisualizer() {
  const [array, setArray] = useState<number[]>([])
  const [sorting, setSorting] = useState(false)
  const [algorithm, setAlgorithm] = useState<SortingAlgorithm>('bubble')
  const [customInput, setCustomInput] = useState('')
  const [error, setError] = useState('')
  const [delay, setDelay] = useState(DELAY_SPEED)
  const [currentStep, setCurrentStep] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const generateRandomArray = useCallback((size: number = DEFAULT_ARRAY_SIZE) => {
    const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1)
    setArray(newArray)
    setCustomInput(newArray.join(', '))
    setError('')
  }, [])

  useEffect(() => {
    generateRandomArray()
  }, [generateRandomArray])

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const animateSwap = (i: number, j: number) => {
    if (containerRef.current) {
      const bars = containerRef.current.children
      gsap.to(bars[i], { y: 20, duration: ANIMATION_SPEED / 2 })
      gsap.to(bars[j], { y: -20, duration: ANIMATION_SPEED / 2 })
      gsap.to(bars[i], { x: (j - i) * (100 / array.length) + '%', duration: ANIMATION_SPEED })
      gsap.to(bars[j], { x: (i - j) * (100 / array.length) + '%', duration: ANIMATION_SPEED })
      gsap.to([bars[i], bars[j]], { y: 0, duration: ANIMATION_SPEED / 2, delay: ANIMATION_SPEED })
    }
  }

  const bubbleSort = async () => {
    const arr = [...array]
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        setCurrentStep(`Comparing ${arr[j]} and ${arr[j+1]}`)
        await sleep(delay)
        if (arr[j] > arr[j + 1]) {
          setCurrentStep(`Swapping ${arr[j]} and ${arr[j+1]}`)
          animateSwap(j, j + 1)
          await sleep(ANIMATION_SPEED * 1000)
          ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
          setArray([...arr])
        }
      }
    }
    setCurrentStep('Sorting complete!')
  }

  const insertionSort = async () => {
    const arr = [...array]
    for (let i = 1; i < arr.length; i++) {
      setCurrentStep(`Inserting ${arr[i]} into the sorted portion`)
      await sleep(delay)
      let j = i - 1
      const temp = arr[i]
      while (j >= 0 && arr[j] > temp) {
        setCurrentStep(`Moving ${arr[j]} to the right`)
        animateSwap(j, j + 1)
        await sleep(ANIMATION_SPEED * 1000)
        arr[j + 1] = arr[j]
        j--
      }
      arr[j + 1] = temp
      setArray([...arr])
    }
    setCurrentStep('Sorting complete!')
  }

  const selectionSort = async () => {
    const arr = [...array]
    for (let i = 0; i < arr.length; i++) {
      setCurrentStep(`Finding minimum element from index ${i} to ${arr.length - 1}`)
      await sleep(delay)
      let minIdx = i
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[j] < arr[minIdx]) {
          minIdx = j
        }
      }
      if (minIdx !== i) {
        setCurrentStep(`Swapping ${arr[i]} with ${arr[minIdx]}`)
        animateSwap(i, minIdx)
        await sleep(ANIMATION_SPEED * 1000)
        ;[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
        setArray([...arr])
      }
    }
    setCurrentStep('Sorting complete!')
  }

  const quickSort = async () => {
    const arr = [...array]
    await quickSortHelper(arr, 0, arr.length - 1)
    setCurrentStep('Sorting complete!')
  }

  const quickSortHelper = async (arr: number[], low: number, high: number) => {
    if (low < high) {
      setCurrentStep(`Partitioning array from index ${low} to ${high}`)
      await sleep(delay)
      const pivotIndex = await partition(arr, low, high)
      await quickSortHelper(arr, low, pivotIndex - 1)
      await quickSortHelper(arr, pivotIndex + 1, high)
    }
  }

  const partition = async (arr: number[], low: number, high: number) => {
    const pivot = arr[high]
    setCurrentStep(`Choosing pivot: ${pivot}`)
    await sleep(delay)
    let i = low - 1
    for (let j = low; j < high; j++) {
      if (arr[j] < pivot) {
        i++
        setCurrentStep(`Swapping ${arr[i]} with ${arr[j]}`)
        animateSwap(i, j)
        await sleep(ANIMATION_SPEED * 1000)
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
        setArray([...arr])
      }
    }
    setCurrentStep(`Placing pivot ${pivot} in its correct position`)
    animateSwap(i + 1, high)
    await sleep(ANIMATION_SPEED * 1000)
    ;[arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]
    setArray([...arr])
    return i + 1
  }

  const startSort = async () => {
    setSorting(true)
    switch (algorithm) {
      case 'bubble':
        await bubbleSort()
        break
      case 'insertion':
        await insertionSort()
        break
      case 'selection':
        await selectionSort()
        break
      case 'quick':
        await quickSort()
        break
    }
    setSorting(false)
  }

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomInput(e.target.value)
  }

  const applyCustomArray = () => {
    try {
      const customArray = customInput.split(',').map(num => {
        const parsed = parseInt(num.trim(), 10)
        if (isNaN(parsed)) throw new Error('Invalid input')
        return parsed
      })
      if (customArray.length === 0) throw new Error('Array is empty')
      if (customArray.length > 100) throw new Error('Array is too large (max 100 elements)')
      setArray(customArray)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid input')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Sorting Visualizer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Tabs value={algorithm} onValueChange={(value) => setAlgorithm(value as SortingAlgorithm)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="bubble">Bubble Sort</TabsTrigger>
                <TabsTrigger value="insertion">Insertion Sort</TabsTrigger>
                <TabsTrigger value="selection">Selection Sort</TabsTrigger>
                <TabsTrigger value="quick">Quick Sort</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => generateRandomArray()} disabled={sorting}>
                Generate Random Array
              </Button>
              <Button onClick={startSort} disabled={sorting}>
                Start Sorting
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Label htmlFor="custom-array" className="w-full sm:w-32">Custom Array:</Label>
                <div className="flex w-full">
                  <Input
                    id="custom-array"
                    value={customInput}
                    onChange={handleCustomInputChange}
                    placeholder="Enter numbers separated by commas"
                    className="flex-grow"
                    disabled={sorting}
                  />
                  <Button onClick={applyCustomArray} disabled={sorting} className="ml-2">
                    Apply
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Label htmlFor="delay-slider" className="w-full sm:w-32">Delay (ms):</Label>
                <div className="flex items-center w-full gap-2">
                  <Slider
                    id="delay-slider"
                    min={0}
                    max={2000}
                    step={100}
                    value={[delay]}
                    onValueChange={(value) => setDelay(value[0])}
                    disabled={sorting}
                    className="flex-grow"
                  />
                  <span className="w-12 text-right">{delay}</span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-8 flex items-center justify-center">
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="text-lg font-semibold"
              >
                {currentStep}
              </motion.p>
            </div>

            <div className="h-64 sm:h-96 flex items-end space-x-1" ref={containerRef}>
              {array.map((value, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{
                    width: `${100 / array.length}%`,
                  }}
                  className="bg-blue-500 relative"
                >
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-white">
                    {value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}