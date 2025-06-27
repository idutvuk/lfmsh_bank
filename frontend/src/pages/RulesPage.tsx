import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Background } from "@/components/Background"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/Navbar"

export default function RulesPage() {
  const navigate = useNavigate()

  return (
    <Background>
      {/* Header */}
      <Navbar 
        showBackButton={true}
        title="Правила"
      />

      <div className="w-full max-w-screen-xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Основные правила</h2>
            
            <div className="prose max-w-none mb-8">
              <p>
                Банк ЛФМШ — это система учета учебных достижений пионеров. За посещение занятий, выполнение заданий
                и другую активность пионеры получают валюту Школы — ароматные баксы (@).
              </p>
              <p>
                В конце смены пионеры обменивают заработанные за смену баксы на сертификаты об окончании ЛФМШ с указанием
                достижений пионера.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg">Как заработать баксы?</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Посещение лекций: 2@</li>
                    <li>Посещение семинаров: 3@</li>
                    <li>Выполнение лабораторных: 4-10@</li>
                    <li>Факультативы: 2-5@</li>
                    <li>Специальные активности: индивидуальная оценка</li>
                    <li>Переводы от других пионеров</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg">Как работают штрафы?</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">Штрафы налагаются в следующих случаях:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Нарушение правил поведения: 5-20@</li>
                    <li>Опоздание на занятия: 2-5@</li>
                    <li>Непосещение обязательных занятий: 10@</li>
                    <li>Нарушение режима: 5-15@</li>
                  </ul>
                  <p className="mt-2">Штрафы должны быть одобрены Банкиром и могут быть обжалованы.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg">Переводы между пионерами</AccordionTrigger>
                <AccordionContent>
                  <p>
                    Пионеры могут переводить баксы друг другу. Для этого нужно создать транзакцию
                    в соответствующем разделе приложения, указав получателей и сумму перевода.
                    Минимальная сумма перевода: 1@
                  </p>
                  <p className="mt-2">
                    Перевод должен иметь описание. Переводы проходят модерацию Банкира.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-lg">Получение сертификата</AccordionTrigger>
                <AccordionContent>
                  <p>
                    В конце смены баксы конвертируются в сертификаты об окончании ЛФМШ.
                    Для получения сертификата необходимо:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>Набрать минимум 100@ за смену</li>
                    <li>Посетить не менее 80% лекций</li>
                    <li>Выполнить не менее 70% лабораторных работ</li>
                  </ul>
                  <p className="mt-2">
                    Сертификат отражает успехи пионера и может быть полезным дополнением к портфолио.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </Background>
  )
} 